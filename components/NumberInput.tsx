'use client';

interface NumberInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    disabled?: boolean;
}

export default function NumberInput({
    label,
    value,
    onChange,
    min = 1,
    max = 9999,
    step = 10,
    unit = 'seconds',
    disabled = false,
}: NumberInputProps) {
    const handleIncrement = () => {
        const newValue = Math.min(value + step, max);
        onChange(newValue);
    };

    const handleDecrement = () => {
        const newValue = Math.max(value - step, min);
        onChange(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value) || min;
        onChange(Math.max(min, Math.min(newValue, max)));
    };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (secs === 0) return `${mins}m`;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="number-input-group">
            <label>{label}</label>
            <div className="number-input-wrapper">
                <button
                    type="button"
                    className="number-btn decrement"
                    onClick={handleDecrement}
                    disabled={disabled || value <= min}
                >
                    −
                </button>
                <div className="number-display">
                    <input
                        type="number"
                        value={value}
                        onChange={handleInputChange}
                        min={min}
                        max={max}
                        disabled={disabled}
                    />
                    <span className="number-unit">{unit}</span>
                </div>
                <button
                    type="button"
                    className="number-btn increment"
                    onClick={handleIncrement}
                    disabled={disabled || value >= max}
                >
                    +
                </button>
            </div>
            <span className="number-hint">{formatTime(value)}</span>
        </div>
    );
}
