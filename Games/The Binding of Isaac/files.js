async function fetchBinary(url) {
    const res = await fetch(url);
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        total += value.byteLength;
    }

    // combine chunks
    const output = new Uint8Array(total);
    let offset = 0;

    for (const chunk of chunks) {
        output.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return output;
}

async function mergeParts(parts) {
    const buffers = await Promise.all(parts.map(fetchBinary));
    const totalSize = buffers.reduce((a, b) => a + b.byteLength, 0);
    const output = new Uint8Array(totalSize);

    let offset = 0;
    for (const buf of buffers) {
        output.set(buf, offset);
        offset += buf.byteLength;
    }

    return URL.createObjectURL(new Blob([output.buffer], { type: "application/x-shockwave-flash" }))
}
