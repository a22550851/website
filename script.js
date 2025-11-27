// script.js
function showPopup(text) {
    document.getElementById("popup-text").textContent = text;
    document.getElementById("popup").style.display = "block";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}
