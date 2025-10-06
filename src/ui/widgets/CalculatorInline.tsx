import React, { useState } from 'react';
import Draggable from 'react-draggable';

export const CalculatorInline: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [open, setOpen] = useState(true);
  const append = (v: string) => setDisplay((d) => (d === '0' ? v : d + v));
  const clear = () => setDisplay('0');
  const back = () => setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'));
  const half = () => setDisplay(String((Number(display) || 0) / 2));
  const percent = () => setDisplay(String((Number(display) || 0) / 100));
  const evalExpr = () => {
    try {
      const result = Function(`"use strict";return (${display})`)();
      setDisplay(String(result));
    } catch {
      setDisplay('Erro');
    }
  };
  if (!open) {
    return (
      <button style={styles.fab} onClick={() => setOpen(true)}>Calc</button>
    );
  }

  return (
    <Draggable handle=".calc-drag">
      <div style={styles.floating}>
        <div className="calc-drag" style={styles.headerDrag}>
          <span>Calculadora</span>
          <button style={styles.close} onClick={() => setOpen(false)}>×</button>
        </div>
        <input style={styles.display} value={display} readOnly />
        <div style={styles.grid}>
        <button style={styles.btn} onClick={clear}>C</button>
        <button style={styles.btn} onClick={back}>⌫</button>
        <button style={styles.btn} onClick={() => append('%')}>%</button>
        <button style={styles.btnAcc} onClick={() => append('/')}>/</button>
        <button style={styles.btn} onClick={() => append('7')}>7</button>
        <button style={styles.btn} onClick={() => append('8')}>8</button>
        <button style={styles.btn} onClick={() => append('9')}>9</button>
        <button style={styles.btnAcc} onClick={() => append('*')}>*</button>
        <button style={styles.btn} onClick={() => append('4')}>4</button>
        <button style={styles.btn} onClick={() => append('5')}>5</button>
        <button style={styles.btn} onClick={() => append('6')}>6</button>
        <button style={styles.btnAcc} onClick={() => append('-')}>-</button>
        <button style={styles.btn} onClick={() => append('1')}>1</button>
        <button style={styles.btn} onClick={() => append('2')}>2</button>
        <button style={styles.btn} onClick={() => append('3')}>3</button>
        <button style={styles.btnAcc} onClick={() => append('+')}>+</button>
        <button style={styles.btn} onClick={() => append('0')}>0</button>
        <button style={styles.btn} onClick={() => append('.')}>.</button>
        <button style={styles.btn} onClick={half}>1/2</button>
        <button style={styles.btn} onClick={percent}>%</button>
        <button style={styles.btnPri} onClick={evalExpr}>=</button>
      </div>
      </div>
    </Draggable>
  );
};

const styles: Record<string, React.CSSProperties> = {
  floating: { position: 'fixed', right: 20, bottom: 20, border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#ffffff', maxWidth: 320, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 50 },
  headerDrag: { cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, marginBottom: 8 },
  display: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 8 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  btn: { padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer' },
  btnAcc: { padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e7ff', background: '#eef2ff', cursor: 'pointer' },
  btnPri: { gridColumn: 'span 4', padding: '12px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' },
  fab: { position: 'fixed', right: 20, bottom: 20, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 14px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.15)', zIndex: 40 },
  close: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 },
};


