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
    const buffers = await Promise.all(parts.map(part => fetchWithProgress(part)));
    const mergedBlob = new Blob(buffers);
    return URL.createObjectURL(mergedBlob);
}