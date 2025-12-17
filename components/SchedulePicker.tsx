'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface SchedulePickerProps {
    onScheduleChange: (date: Date | null) => void;
    disabled?: boolean;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SchedulePicker({ onScheduleChange, disabled }: SchedulePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [countdown, setCountdown] = useState<string>('');

    const pickerRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (selectedDate) {
            intervalRef.current = setInterval(() => {
                const now = Date.now();
                const diff = selectedDate.getTime() - now;

                if (diff <= 0) {
                    setCountdown('Starting now...');
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setCountdown(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }, 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [selectedDate]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return { firstDay, daysInMonth };
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() &&
            viewDate.getMonth() === today.getMonth() &&
            viewDate.getFullYear() === today.getFullYear();
    };

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return day === selectedDate.getDate() &&
            viewDate.getMonth() === selectedDate.getMonth() &&
            viewDate.getFullYear() === selectedDate.getFullYear();
    };

    const isPast = (day: number) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        return checkDate < today;
    };

    const handleDayClick = (day: number) => {
        if (isPast(day)) return;
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, selectedHour, selectedMinute);
        setSelectedDate(newDate);
        onScheduleChange(newDate);
    };

    const handleTimeChange = (hour: number, minute: number) => {
        setSelectedHour(hour);
        setSelectedMinute(minute);
        if (selectedDate) {
            const newDate = new Date(selectedDate);
            newDate.setHours(hour, minute);
            setSelectedDate(newDate);
            onScheduleChange(newDate);
        }
    };

    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));
    };

    const clearSchedule = () => {
        setSelectedDate(null);
        setCountdown('');
        onScheduleChange(null);
    };

    const formatSelectedDate = () => {
        if (!selectedDate) return 'Select date & time';
        return selectedDate.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const { firstDay, daysInMonth } = getDaysInMonth(viewDate);
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const past = isPast(day);
        days.push(
            <button
                key={day}
                type="button"
                className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''} ${past ? 'past' : ''}`}
                onClick={() => handleDayClick(day)}
                disabled={past || disabled}
            >
                {day}
            </button>
        );
    }

    return (
        <div className="schedule-picker-wrapper" ref={pickerRef}>
            <div className="schedule-trigger-row">
                <button
                    type="button"
                    className="schedule-trigger"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                >
                    <Calendar className="schedule-icon" size={18} />
                    <span className="schedule-text">{formatSelectedDate()}</span>
                </button>
                {selectedDate && (
                    <button type="button" className="btn-clear" onClick={clearSchedule} disabled={disabled}>
                        Clear
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="calendar-popup">
                    {/* Header */}
                    <div className="calendar-header">
                        <button type="button" className="calendar-nav" onClick={prevMonth}>
                            <ChevronLeft size={18} />
                        </button>
                        <span className="calendar-month">
                            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </span>
                        <button type="button" className="calendar-nav" onClick={nextMonth}>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Days of week */}
                    <div className="calendar-weekdays">
                        {DAYS.map(day => (
                            <div key={day} className="calendar-weekday">{day}</div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="calendar-grid">
                        {days}
                    </div>

                    {/* Time picker */}
                    <div className="time-picker">
                        <span className="time-label">Time:</span>
                        <select
                            value={selectedHour}
                            onChange={(e) => handleTimeChange(Number(e.target.value), selectedMinute)}
                            className="time-select"
                        >
                            {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>
                                    {i.toString().padStart(2, '0')}
                                </option>
                            ))}
                        </select>
                        <span className="time-colon">:</span>
                        <select
                            value={selectedMinute}
                            onChange={(e) => handleTimeChange(selectedHour, Number(e.target.value))}
                            className="time-select"
                        >
                            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                                <option key={m} value={m}>
                                    {m.toString().padStart(2, '0')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {selectedDate && countdown && (
                <div className="countdown-display">
                    <div className="countdown-label">Starts in</div>
                    <div className="countdown-timer">{countdown}</div>
                </div>
            )}
        </div>
    );
}
