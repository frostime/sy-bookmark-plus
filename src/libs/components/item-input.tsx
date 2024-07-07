import { createSignal } from "solid-js";

interface IProps extends ISettingItemCore {
    changed: (v?: any) => void;
    nofnSize?: boolean;
    flex1?: boolean;
}

export default function InputItem(props: IProps) {
    const [value, setValue] = createSignal(props.value);

    const fn_size = props?.nofnSize === true ? false : true;

    function click() {
        props.button?.callback();
    }

    function changed() {
        props?.changed(value());
    }

    function renderInput() {
        if (props.type === "checkbox") {
            return (
                <input
                    class="b3-switch fn__flex-center"
                    id={props.key}
                    type="checkbox"
                    checked={value()}
                    onInput={(e) => {
                        setValue(e.currentTarget.checked);
                        changed();
                    }}
                />
            );
        } else if (props.type === "textinput") {
            return (
                <input
                    class="b3-text-field fn__flex-center"
                    classList={{ fn__size200: fn_size, 'fn__flex-1': props.flex1 }}
                    id={props.key}
                    placeholder={props.placeholder}
                    value={value()}
                    onInput={(e) => {
                        setValue(e.currentTarget.value);
                        changed();
                    }}
                />
            );
        } else if (props.type === "textarea") {
            return (
                <textarea
                    class="b3-text-field fn__block"
                    style="resize: vertical; height: 10em; white-space: nowrap;"
                    value={value()}
                    onInput={(e) => {
                        setValue(e.currentTarget.value);
                        changed();
                    }}
                />
            );
        } else if (props.type === "number") {
            return (
                <input
                    class="b3-text-field fn__flex-center"
                    classList={{ fn__size200: fn_size }}
                    id={props.key}
                    type="number"
                    value={value()}
                    onInput={(e) => {
                        setValue(e.currentTarget.value);
                        changed();
                    }}
                />
            );
        } else if (props.type === "button") {
            return (
                <button
                    class="b3-button b3-button--outline fn__flex-center"
                    classList={{ fn__size200: fn_size }}
                    id={props.key}
                    onClick={click}
                >
                    {props.button.label}
                </button>
            );
        } else if (props.type === "select") {
            return (
                <select
                    class="b3-select fn__flex-center"
                    classList={{ fn__size200: fn_size }}
                    id={props.key}
                    value={value()}
                    onChange={(e) => {
                        setValue(e.currentTarget.value);
                        changed();
                    }}
                >
                    {Object.entries(props.options).map(([optionValue, text]) => (
                        <option value={optionValue}>{text}</option>
                    ))}
                </select>
            );
        } else if (props.type === "slider") {
            return (
                <div class="b3-tooltips b3-tooltips__n" aria-label={value()}>
                    <input
                        class="b3-slider"
                        classList={{ fn__size200: fn_size }}
                        id={props.key}
                        min={props.slider.min}
                        max={props.slider.max}
                        step={props.slider.step}
                        type="range"
                        value={value()}
                        onInput={(e) => {
                            setValue(e.currentTarget.value);
                            changed();
                        }}
                    />
                </div>
            );
        }
    }

    return (
        <>
            {renderInput()}
        </>
    );
}
