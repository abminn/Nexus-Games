async function fetchWithProgress(url) {
            const response = await fetch(url);
            const reader = response.body.getReader();
            let chunks = [];
            let received = 0;
            while (true) {
                const {
                    done,
                    value
                } = await reader.read();
                if (done) break;
                received += value.length;
                loadedBytes += value.length;
                chunks.push(value);
            }
            let fullBuffer = new Uint8Array(received);
            let offset = 0;
            for (let chunk of chunks) {
                fullBuffer.set(chunk, offset);
                offset += chunk.length;
            }
            return fullBuffer.buffer;
        }
  
  async function combineUnityData(parts, finalName) {
    const blobs = [];
    for (let part of parts) {
        const response = await fetch(part); // fetch each chunk
        const blob = await response.blob();
        blobs.push(blob);
    }
    const buffers = await Promise.all(blobs.map(part => fetchWithProgress(part)));
    const mergedBlob = new Blob(buffers);
    return URL.createObjectURL(mergedBlob);
}