declare module 'canvas' {
  export function createCanvas(width: number, height: number): {
    getContext(type: '2d'): {
      fillStyle: string;
      font: string;
      fillRect(x: number, y: number, w: number, h: number): void;
      fillText(text: string, x: number, y: number): void;
    };
    toBuffer(format: string): Buffer;
  };
}
