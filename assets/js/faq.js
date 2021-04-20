init();

function init() {
  creatCharityButtons();
}

function creatCharityButtons() {
    const $buttonsDiv = $("#charity-buttons");
    charities.forEach((charity) => {
        if (charity.wiki !== "") {
            const $button = $("<button>");
            $button.addClass("button");
            $button.text(charity.wiki);
            $buttonsDiv.append($button);
            $button.click(wikiSearch);
        }
    });
}

function wikiSearch(){
    $('#wiki-box').empty();
    console.log(this.textContent);
    const requestURL = `https://en.wikipedia.org/w/api.php?action=parse&origin=*&page=${this.textContent}&prop=text&format=json&formatversion=2`;
    fetch(requestURL, {method: "GET"})
    .then(response => {
      return response.json();
    }).then(obj => {
      const $element = $(obj.parse.text);
      $('#wiki-box').append($element);
    })
}
