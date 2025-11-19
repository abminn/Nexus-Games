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
  
async function combineUnityData(parts) {
    const buffers = await Promise.all(parts.map(part => fetchWithProgress(part)));
    const mergedBlob = new Blob(buffers, { type: "application/octet-stream" });

    let url = URL.createObjectURL(mergedBlob);

    // JSBin and similar environments insert hidden linebreaks
    url = url.replace(/\r?\n|\r/g, "").trim();

    // UnityLoader requires a "fake extension"
    return url + "#rc.data.unityweb";
}
