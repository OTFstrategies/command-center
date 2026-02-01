export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown
  position: Position;
  size: Size;
  project: string;
  connections: string[]; // Note IDs this note links to
  created: string;
  updated: string;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface NotesCanvas {
  project: string;
  notes: Note[];
  viewport: CanvasViewport;
}

export interface NotesData {
  canvases: NotesCanvas[];
  currentProject: string;
}
