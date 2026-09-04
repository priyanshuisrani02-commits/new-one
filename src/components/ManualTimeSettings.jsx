import { useEffect } from 'react';
import { useCouple } from '../context/CoupleContext';

const getTimeForZone = (timeZone) => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const hour = parts.find((part) => part.type === 'hour')?.value || '00';
    const minute = parts.find((part) => part.type === 'minute')?.value || '00';
    return `${hour === '24' ? '00' : hour}:${minute}`;
  } catch {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
};

const normalizeSavedTime = (value) => /^\d{2}:\d{2}$/.test(value || '') ? value : getTimeForZone(value);

const setNativeValue = (input, value) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const patchTimeField = (labelText, savedValue) => {
  const label = Array.from(document.querySelectorAll('label')).find((node) => node.textContent?.trim() === labelText);
  if (!label) return;
  const wrapper = label.parentElement;
  const input = wrapper?.querySelector('input');
  if (!input) return;

  if (label.dataset.manualTimePatched !== 'true') {
    label.dataset.manualTimePatched = 'true';
    label.textContent = labelText.replace('Timezone', 'Time');
    const hint = document.createElement('p');
    hint.className = 'text-[10px] text-rose-400/50 mt-1';
    hint.textContent = 'Set the time directly. Location/timezone is not used.';
    wrapper.appendChild(hint);
  }

  input.type = 'time';
  input.setAttribute('aria-label', labelText.replace('Timezone', 'Time'));
  if (!input.dataset.manualTimeValueInitialized) {
    input.dataset.manualTimeValueInitialized = 'true';
    setNativeValue(input, normalizeSavedTime(savedValue));
  }
};

export const ManualTimeSettings = () => {
  const { coupleSettings } = useCouple();

  useEffect(() => {
    const patch = () => {
      patchTimeField('His Timezone', coupleSettings.his_timezone);
      patchTimeField('Her Timezone', coupleSettings.her_timezone);
    };
    patch();
    const observer = new MutationObserver(patch);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(patch, 500);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, [coupleSettings.his_timezone, coupleSettings.her_timezone]);

  return null;
};
