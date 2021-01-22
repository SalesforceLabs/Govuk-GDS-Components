import { LightningElement,api } from 'lwc';

export default class GovMarkupTextEditor extends LightningElement {
    @api inputVariables;
    @api elementInfo = {};
    @api builderContext = {};

    showModal = false;

    connectedCallback() {
    }

    get markupText() {
        const param = this.inputVariables.find(({name}) => name === 'markupText');
        return param && param.value;
    }

    // handleMarkupChange(event) {
    //     console.log(event.detail.value);
    //     this.handleChange('markupText', 'String', event.detail.value);
    // }

    handleMarkupChange(event) {
        const element = this.template.querySelector(".markupTextarea");
        const value = element.value;
        this.handleChange('markupText', 'String', value);
    }

    handleChange(fieldName, fieldType, fieldValue) {
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
        this.showModal = true;
    }

    handleCloseModal(event) {
        this.showModal = false;
    }

    @api
    validate() {
        return [];
    }
}