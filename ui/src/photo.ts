// Shrink a camera photo on the phone before it goes anywhere. A 4 MB
// photo will not leave a village on two bars; a 60 KB one will.
export function shrinkPhoto(file: File, maxSide = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("not an image"));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.62));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// Rough size of a data URL once decoded, for the "small enough" note.
export function kbOf(dataUrl: string): number {
  return Math.round((dataUrl.length * 0.75) / 1024);
}
