import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios';

const Stopwatch = ({ taskId, onSaveSuccess }) => {
  const storageKey = `sw_task_${taskId}`;

  // ✅ Load from localStorage on mount
  const loadState = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { time, isRunning, startedAt } = JSON.parse(saved);
        if (isRunning && startedAt) {
          // Calculate elapsed time since page left
          const elapsed = Math.floor((Date.now() - startedAt) / 1000);
          return { time: time + elapsed, isRunning: true };
        }
        return { time, isRunning: false };
      }
    } catch {}
    return { time: 0, isRunning: false };
  };

  const initial = loadState();
  const [time, setTime]           = useState(initial.time);
  const [isRunning, setIsRunning] = useState(initial.isRunning);
  const [onBreak, setOnBreak]     = useState(false);
  const timerRef = useRef(null);

  // ✅ Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({
      time,
      isRunning,
      startedAt: isRunning ? Date.now() - (time * 1000) : null
    }));
  }, [time, isRunning, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Auto-save when user leaves page
  useEffect(() => {
    const handleUnload = () => {
      if (isRunning && time > 0) {
        localStorage.setItem(storageKey, JSON.stringify({
          time,
          isRunning: true,
          startedAt: Date.now() - (time * 1000)
        }));
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [isRunning, time, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer logic
  useEffect(() => {
    if (isRunning && !onBreak) {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, onBreak]);

  // Cleanup on unmount — keep localStorage
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStart = (e) => {
    e.stopPropagation();
    setIsRunning(true);
    setOnBreak(false);
  };

  const handleStop = (e) => {
    e.stopPropagation();
    setIsRunning(false);
    setOnBreak(false);
    saveTimeEntry(time);
    // ✅ Clear localStorage after save
    localStorage.removeItem(storageKey);
    setTime(0);
  };

  const handleBreak = (e) => {
    e.stopPropagation();
    if (!isRunning) return;
    setOnBreak(b => !b);
  };

  const handleReset = (e) => {
    e.stopPropagation();
    clearInterval(timerRef.current);
    setIsRunning(false);
    setOnBreak(false);
    setTime(0);
    localStorage.removeItem(storageKey);
  };

  const saveTimeEntry = async (elapsedSeconds) => {
    if (elapsedSeconds <= 0) return;
    try {
      await api.post('/time-entries/', {
        task_id:          taskId,
        duration_seconds: elapsedSeconds,
        date:             new Date().toISOString().split('T')[0],
        note:             "Auto-saved"
      });
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error("Time entry save failed:", err);
    }
  };

  const formatTime = (seconds) => {
    const hrs  = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  };

  return (
    <div className="sw-wrap">
      <div className={`sw-display ${isRunning && !onBreak ? 'active' : ''} ${onBreak ? 'break' : ''}`}>
        <span className="sw-icon">
          {onBreak ? '☕' : isRunning ? '⏱' : '⏸'}
        </span>
        <span className="sw-time">{formatTime(time)}</span>
        {onBreak && <span className="sw-break-badge">On Break</span>}
      </div>

      <div className="sw-btns">
        {!isRunning ? (
          <button className="sw-btn start" type="button" onClick={handleStart}>▶ Start</button>
        ) : (
          <button className="sw-btn stop" type="button" onClick={handleStop}>⏹ Stop & Save</button>
        )}
        <button className={`sw-btn break ${onBreak ? 'break-active' : ''}`}
          type="button" onClick={handleBreak} disabled={!isRunning}>
          {onBreak ? '▶ Resume' : '☕ Break'}
        </button>
        <button className="sw-btn reset" type="button" onClick={handleReset}>↺ Reset</button>
      </div>
    </div>
  );
};

export default Stopwatch;