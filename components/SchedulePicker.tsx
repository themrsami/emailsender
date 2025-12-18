'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface SchedulePickerProps {
    onScheduleChange: (date: Date | null) => void;
    disabled?: boolean;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SchedulePicker({ onScheduleChange, disabled }: SchedulePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmedDate, setConfirmedDate] = useState<Date | null>(null); // The actual scheduled date
    const [tempSelectedDay, setTempSelectedDay] = useState<number | null>(null); // Temp selection in calendar
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
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Countdown timer
    useEffect(() => {
        if (confirmedDate) {
            const updateCountdown = () => {
                const now = Date.now();
                const diff = confirmedDate.getTime() - now;

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
            };
            updateCountdown();
            intervalRef.current = setInterval(updateCountdown, 1000);
        } else {
            setCountdown('');
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [confirmedDate]);

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

    const isTempSelected = (day: number) => {
        return tempSelectedDay === day;
    };

    const isPast = (day: number) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        return checkDate < today;
    };

    const handleDayClick = (day: number) => {
        if (isPast(day)) return;
        setTempSelectedDay(day);
    };

    const handleSetSchedule = () => {
        if (tempSelectedDay === null) return;
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), tempSelectedDay, selectedHour, selectedMinute);
        setConfirmedDate(newDate);
        onScheduleChange(newDate);
        setIsOpen(false);
    };

    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
        setTempSelectedDay(null);
    };

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));
        setTempSelectedDay(null);
    };

    const clearSchedule = () => {
        setConfirmedDate(null);
        setTempSelectedDay(null);
        setCountdown('');
        onScheduleChange(null);
    };

    const openPicker = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        // Reset temp selection when opening
        if (!isOpen) {
            setTempSelectedDay(null);
        }
    };

    const formatSelectedDate = () => {
        if (!confirmedDate) return 'Select date & time';
        return confirmedDate.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
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
                className={`calendar-day ${isToday(day) ? 'today' : ''} ${isTempSelected(day) ? 'selected' : ''} ${past ? 'past' : ''}`}
                onClick={() => handleDayClick(day)}
                disabled={past || disabled}
            >
                {day}
            </button>
        );
    }

    return (
        <div className="schedule-picker-wrapper" ref={pickerRef}>
            {/* Trigger Row with Timer */}
            <div className="schedule-trigger-row">
                <button
                    type="button"
                    className="schedule-trigger"
                    onClick={openPicker}
                    disabled={disabled}
                >
                    <Calendar className="schedule-icon" size={18} />
                    <span className="schedule-text">{formatSelectedDate()}</span>
                </button>
                {confirmedDate && (
                    <>
                        <div className="countdown-badge">
                            <span className="countdown-timer">{countdown}</span>
                        </div>
                        <button type="button" className="btn-clear" onClick={clearSchedule} disabled={disabled}>
                            Clear
                        </button>
                    </>
                )}
            </div>

            {/* Calendar Popup */}
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
                            onChange={(e) => setSelectedHour(Number(e.target.value))}
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
                            onChange={(e) => setSelectedMinute(Number(e.target.value))}
                            className="time-select"
                        >
                            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                                <option key={m} value={m}>
                                    {m.toString().padStart(2, '0')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Set Button */}
                    <button
                        type="button"
                        className="btn-calendar-set"
                        onClick={handleSetSchedule}
                        disabled={tempSelectedDay === null}
                    >
                        <Check size={16} />
                        Set Schedule
                    </button>
                </div>
            )}
        </div>
    );
}
