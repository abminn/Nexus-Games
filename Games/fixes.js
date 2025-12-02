function changeUnityLoader(file) {
  return fetch(file)
    .then(res => res.text())
    .then(text => {
        const alphabet = [
          "a","b","c","d","e","f","g","h","i","j","k","l","m",
          "n","o","p","q","r","s","t","u","v","w","x","y","z"
        ];
        alphabet.forEach(letter => {
         if (text.includes(letter + ".streamingAssetsUrl=")) {
            text = text.replace(`${letter}.streamingAssetsUrl=new URL(${letter}.streamingAssetsUrl,document.URL).href`, `${letter}.streamingAssetsUrl=""`)
         }
        })
        let newUrl = "data:text/javascript;base64," + btoa(text);
        return newUrl;
    });
}
