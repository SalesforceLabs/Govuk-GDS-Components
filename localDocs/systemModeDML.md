# FileUploadAdvancedHelper — SYSTEM_MODE DML remediation

Branch: `feature/fileUploadAdvancedHelperSytemModeDML`

Local notes only. This file is excluded from the package via `.gitignore`.

---

## What actually happened

Two commits on 2026-10-21 bumped the API version from `56.0` → `68.0`:
- `force-app/main/default/classes/FileUploadAdvancedHelper.cls-meta.xml` — commit `60e0fd8`
- `force-app/main/default/classes/FileUploadAdvancedHelper_Test.cls-meta.xml` — commit `b35c481`

The package upload failed the same day. Both test failures stack at `FileUploadAdvancedHelper.appendDataToContentVersion: line 72` — which is the bare `update vers;` on ContentVersion.

## The actual rule that triggered it

Salesforce Apex Developer Guide, verbatim:

> *"In API version 67.0 and later, Apex runs in user context by default, meaning that the current user's permissions and field-level security (FLS) are enforced during code execution. In API version 66.0 and earlier, system mode is the default."*

| API | Release | DML default |
|---|---|---|
| ≤ 66.0 | Spring '26 and earlier | **System mode** — FLS/CRUD skipped |
| ≥ 67.0 | Summer '26+ | **User mode** — FLS/CRUD enforced |
| 68.0 | **Winter '27** (your bump) | User mode — hence the failure |

The earlier opt-in equivalents (so you can see this isn't new, just the default flipped):
- **API 59 (Winter '24)** — `Database.insert(records, AccessLevel.USER_MODE)` / `.SYSTEM_MODE` introduced
- **API 55 (Summer '22)** — `WITH USER_MODE` / `WITH SYSTEM_MODE` SOQL clauses introduced
- **API 61–66** — docs started recommending user mode but kept system mode as the default
- **API 67 (Summer '26)** — flip became default; this is "the fairly recent change" referenced in the task
- **API 68 (Winter '27)** — same default, which the package now inherits

## Why `public without sharing` doesn't save us

A common misconception. Three distinct enforcement layers:

| Layer | Controlled by | User mode flip affects it? |
|---|---|---|
| Record visibility (sharing rules) | `with/without sharing` | No |
| CRUD (object permissions) | Mode (user vs system) | **Yes** |
| FLS (field permissions) | Mode (user vs system) | **Yes** |

`without sharing` only disables sharing-rule enforcement. It does not touch FLS. So the class keyword provides zero relief from the API-68 default.

## Before vs after at line 72

```apex
// Line 65
ContentVersion vers = [SELECT Id, VersionData FROM ContentVersion WHERE Id = :versionId];
vers.VersionData = EncodingUtil.base64Decode(...);
update vers;   // line 72
```

| | API 56 (before) | API 68 (now) |
|---|---|---|
| SOQL at L65 | System mode: no FLS read check | User mode: FLS read checked on every selected field |
| `update vers` at L72 | System mode: no FLS/CRUD check | User mode: `Update` permission required on ContentVersion + **Edit FLS required on every modified field** (`VersionData`) |
| Field in `createContentVers` L28-34 that writes managed custom field `uxgovuk__Guest_Record_fileupload__c` | Inserted regardless | Requires edit FLS on that managed field |

The test's running user — even an admin — may not hold `Edit` on `ContentVersion.VersionData` under user-mode rules, because `VersionData` is a system-managed BLOB field with its own permission semantics. For packaged managed fields (`Guest_Record_fileupload__c`), FLS is not auto-granted to all profiles on install either.

## Recommended fix — options ranked

### Option 1 (recommended): Explicit `SYSTEM_MODE` on the DML paths that need it

Keep API 68 (don't give up on the modernisation), opt out of user mode only where it's intentional. This is the pattern Salesforce documents for exactly this use case.

```apex
// L38
List<Database.SaveResult> results = Database.insert(versions, AccessLevel.SYSTEM_MODE);

// L72
update as system vers;         // Apex syntactic form, API 67+
// or
Database.update(vers, AccessLevel.SYSTEM_MODE);

// L100, L123, L132, L214 — same treatment where DML is on ContentVersion/ContentDocument/Link
```

Pros: minimal surface, explicit intent at every elevated call site (auditable).
Cons: you must enumerate every DML and SOQL that needs it.

### Option 2: Revert the helper only to API 66

```xml
<apiVersion>66.0</apiVersion>
```

Pros: zero code change.
Cons: pushes the problem forward one release; you lose any new API-67/68 Apex features; still have to fix it eventually.

### Option 3: Grant FLS via permission set shipped with the package

Add `<fieldPermissions>` entries to a packaged permission set for `Guest_Record_fileupload__c` and ensure guest/standard profiles can edit `ContentVersion.VersionData`.
Pros: aligns with Salesforce's security direction.
Cons: changes the trust model — now every installing admin needs to assign the permset, and the `Guest_Record_fileupload__c` field becomes user-visible (undermines the encryption-based obfuscation).

## Security consequences — honest view

### Current state (API 68, user mode, broken)
- **Security:** FLS now enforced — a guest user cannot write to ContentVersion fields they shouldn't.
- **Functionality:** broken.
- **Net:** safe but useless.

### Option 1 (SYSTEM_MODE on specific DML)
- **Security:** Reverts to pre-change behaviour **only on those lines**. Everything else benefits from user-mode enforcement.
- **The real security control was never FLS.** This component is a guest-upload pattern. The authorisation model is:
  1. Caller supplies a `recordId`.
  2. Server **encrypts** it with a per-session AES key (`getKey/encrypt` at L4-20).
  3. Encrypted blob is persisted on `ContentVersion.Guest_Record_fileupload__c`.
  4. On link creation (L87), server decrypts and uses the recovered Id as `LinkedEntityId`.

  The field is designed to be opaque to the user. Granting FLS on it (Option 3) is **worse** security — users could then read the encrypted blob, grind on patterns, or substitute values. SYSTEM_MODE preserves this blind-write pattern, which is the intent.
- **Residual risk:** AES-256 with managed IV + random session key is fine; `createContentDocLink` swallows exceptions at L103-105 and only logs, so a decrypt failure is silent — worth tightening unrelated to this bug.

### Option 3 (grant FLS)
- **Security:** The encrypted record pointer field becomes user-readable. In theory still safe (AES is not reversible by read access), but it widens the attack surface — any user can enumerate ContentVersions by that custom field. Weakens defence-in-depth without a real gain.

## UX impact

| Fix | Guest upload UX | Admin/dev UX |
|---|---|---|
| Option 1 | Identical to pre-change | No change; developers must remember to use `AccessLevel.SYSTEM_MODE` for new DML paths in this class |
| Option 2 | Identical to pre-change | None, but hands off a future break |
| Option 3 | Admins must assign a permset after install; failed uploads until they do | Install step added to docs |

## Recommendation

**Option 1.** Keep API 68, add `AccessLevel.SYSTEM_MODE` to the DML sites in the helper (L38, L72, L100, L123, L132, L214). The encryption of the record pointer — not FLS — is the security control for this guest-upload flow, and that control is preserved regardless of DML mode.

### Caveat on grounding

Only the API 67.0 default-flip quote is directly from Salesforce docs this session. The Winter '27 release notes page returned a Help loading error on fetch — the API-68 behaviour above is inferred from the documented ≥67.0 rule applying inclusively to 68.0, not from a Winter '27 note quoted verbatim. Worth confirming against the actual Winter '27 Apex release notes before shipping.

## Reference links

- Apex Developer Guide — Enforcing Object and Field Permissions: https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_classes_perms_enforcing.htm
- Apex Developer Guide — Run SOQL and DML in User Mode: https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_classes_perms_enforcing_user_mode.htm
- Database.AccessLevel enum: https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_enum_System_AccessLevel.htm
- Winter '27 release notes landing page: https://help.salesforce.com/s/articleView?id=release-notes.salesforce_release_notes.htm&release=256&type=5
