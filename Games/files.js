async function combineUnityData(parts, finalName) {
    const blobs = [];
    for (let part of parts) {
        const response = await fetch(part); // fetch each chunk
        const blob = await response.blob();
        blobs.push(blob);
    }
    // Combine all parts into one Blob
    const combinedBlob = new Blob(blobs, { type: 'application/octet-stream' });
    // Create a URL for Unity loader
    const combinedUrl = URL.createObjectURL(combinedBlob);
    return combinedUrl;
}
