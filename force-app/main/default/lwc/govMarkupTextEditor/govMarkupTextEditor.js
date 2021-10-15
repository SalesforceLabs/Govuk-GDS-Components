/**
 * Component Name: Gov UK Markup Text Editor
 * Derived_From_Frontend_Version:v3.13.1
 * Created by: Simon Cook Updated by Neetesh Jain/Brenda Campbell
 **/
import { LightningElement,api } from 'lwc';

export default class GovMarkupTextEditor extends LightningElement {
    @api inputVariables;
    @api elementInfo = {};
    @api builderContext = {};

    showModal = false;
    showPreview = false;

    connectedCallback() {
    }

    get markupText() {
        const param = this.inputVariables.find(({name}) => name === 'markupText');
        return param && param.value;
    }

    insertTags(textArea, startTag, endTag) {
        // is there any text selected?
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        const text = textArea.value;

        if(start === end) {
            // No text selected
            textArea.setRangeText(`${startTag}${endTag}`);            
        } else {
            //text selected
            const selectedText = text.substring(start, end);
            textArea.setRangeText(`${startTag}${selectedText}${endTag}`,start,end);            
        }
    }

    handleInsertHeader(event) {
        // insert the heading tag
        const textArea = this.template.querySelector(".markupTextarea");
        this.insertTags(textArea,"<h2 class='govuk-heading-l'>","</h2>");
    }

    handleInsertBody(event) {
        // insert the body tags
        const textArea = this.template.querySelector(".markupTextarea");
        this.insertTags(textArea,"<p class='govuk-body'>","</p>");
    }

    handleChange(fieldName, fieldType, fieldValue) {
        // tell the flow engine about the updated value
        const valueChangedEvent = new CustomEvent(
            'configuration_editor_input_value_changed',  {
                bubbles: true,
                cancelable: false,
                composed: true,
                detail: {
                    name: fieldName,
                    newValue: fieldValue,
                    newValueDataType: fieldType,
                },
            }
        );
        this.dispatchEvent(valueChangedEvent);
    }

    handleShowModal(event) {
        // show the edit modal
        this.showModal = true;
    }

    handleDone(event) {
        // get the value from the text area
        const element = this.template.querySelector(".markupTextarea");
        const value = element.value;
        this.handleChange('markupText', 'String', value);

        // close the modal
        this.handleCloseModal(event);
    }

    handleCloseModal(event) {
        // hide the edit modal
        this.showModal = false;
    }

    handleTogglePreview(event) {
        //console.log("handleTogglePreview called");
        const textArea = this.template.querySelector(".markupTextarea");
        if(textArea) {
            // get the value from the text area
            const value = textArea.value;
            this.handleChange('markupText', 'String', value);

            // update the preview text
            const previewElement = this.template.querySelector(".preview");
            if(previewElement) {
                previewElement.innerHTML = value;
            }
        }

        // toggle the preview mode
        this.showPreview = !this.showPreview;
    }


    get previewClass() {
        if(this.showPreview) {
            return "row";
        } else {
            return "row preview-hidden";
        }
    }

    get textAreaClass() {
        if(this.showPreview) {
            return "row text-area-hidden";
        } else {
            return "row";
        }
    }


    @api
    validate() {
        return [];
    }
}