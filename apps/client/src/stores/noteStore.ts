import { create } from 'zustand';

interface NoteState {
  noteData: any;
  setNoteData: (data: any) => void;
  noteName: string;
  setNoteName: (name: string) => void;
}

const NOTE_DATA_KEY = 'vcw:noteData';
const NOTE_NAME_KEY = 'vcw:noteName';

const safeParse = (str: string | null) => {
  try {
    return str ? JSON.parse(str) : null;
  } catch (e) {
    console.warn('Failed to parse stored note data', e);
    return null;
  }
};

const initialNoteData = safeParse(localStorage.getItem(NOTE_DATA_KEY));
const initialNoteName = localStorage.getItem(NOTE_NAME_KEY) || 'Untitled Note';

export const useNoteStore = create<NoteState>((set) => ({
  noteData: initialNoteData,
  setNoteData: (data) => {
    set({ noteData: data });
    try {
      localStorage.setItem(NOTE_DATA_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to persist noteData', e);
    }
  },
  noteName: initialNoteName,
  setNoteName: (name) => {
    set({ noteName: name });
    try {
      localStorage.setItem(NOTE_NAME_KEY, name);
    } catch (e) {
      console.warn('Failed to persist noteName', e);
    }
  },
}));
