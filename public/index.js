document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("https://freeipapi.com/api/json");
    const data = await response.json();
    document.getElementById("ipAddress").textContent = data.ipAddress;
    document.getElementById("country").textContent = data.countryName;
    document.getElementById("region").textContent = data.regionName;
    document.getElementById("zipCode").textContent = data.zipCode;
    document.getElementById("languages").textContent = data.language;
    document.getElementById("timeZone").textContent = data.timeZone;
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
  loadHistory();
  document.getElementById("currentYear").textContent = new Date().getFullYear();
  fetchFileInfo();
  if (!localStorage.getItem("welcomePopupShown")) {
    showWelcomePopup();
  }
});

function showWelcomePopup() {
  const popupContainer = document.createElement("div");
  popupContainer.className = "welcome-popup-container";

  const popupContent = document.createElement("div");
  popupContent.className = "welcome-popup-content";

  const popupTitle = document.createElement("h2");
  popupTitle.textContent = "Welcome to Cloud CDN";

  const popupMessage = document.createElement("p");
  popupMessage.innerHTML =
    "Dengan Cloud CDN, kami memberikan kecepatan, keamanan, dan performa terbaik untuk situs web Anda. Nikmati konten yang lebih cepat, lebih aman, dan lebih andal di mana pun pengunjung Anda berada.<br><br>Jelajahi fitur-fitur kami dan jika Anda memiliki pertanyaan, tim dukungan kami siap membantu Anda kapan saja.<br><br>Thank you for choosing Cloud CDN!";

  const checkboxContainer = document.createElement("div");
  checkboxContainer.className = "checkbox-container";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "dontShowAgain";

  const checkboxLabel = document.createElement("label");
  checkboxLabel.htmlFor = "dontShowAgain";
  checkboxLabel.textContent = "Don't show again";

  checkboxContainer.appendChild(checkbox);
  checkboxContainer.appendChild(checkboxLabel);

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => {
    if (checkbox.checked) {
      localStorage.setItem("welcomePopupShown", "true");
    }
    document.body.removeChild(popupContainer);
  });

  popupContent.appendChild(popupTitle);
  popupContent.appendChild(popupMessage);
  popupContent.appendChild(checkboxContainer);
  popupContent.appendChild(closeButton);
  popupContainer.appendChild(popupContent);
  document.body.appendChild(popupContainer);
}

function fetchFileInfo() {
  fetch("/files")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("totalFiles").textContent = data.totalFiles;
      document.getElementById("totalSize").textContent = data.totalSize;
    })
    .catch((error) => {
      console.error("Error fetching file information:", error);
      document.getElementById("totalFiles").textContent = "Error";
      document.getElementById("totalSize").textContent = "Error";
    });
}

function formatSize(size) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  displayPreview(file);
});

document.getElementById("fileInput").addEventListener("dragover", function (e) {
  e.preventDefault();
});

document.getElementById("fileInput").addEventListener("drop", function (e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  displayPreview(file);
});

let uploadCompleted = false;

document.getElementById("uploadForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const uploadButton = document.querySelector(".upload-button");
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    showPopup("No files selected", "error");
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    showPopup("File Size Exceeds 50MB", "error");
    return;
  }

  if (uploadCompleted) {
    location.reload();
    return;
  }

  uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  uploadButton.disabled = true;

  const formData = new FormData();
  formData.append("fileInput", file);

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      uploadButton.innerHTML = "Refresh";
      uploadButton.disabled = false;
      showPopup("File Uploaded", "success");
      updateHistory(data.url_response);
      uploadCompleted = true;
    })
    .catch((error) => {
      uploadButton.innerHTML = "Upload";
      uploadButton.disabled = false;
      showPopup("Oops Something Went Wrong", "error");
    });
});

function displayPreview(file) {
  const preview = document.getElementById("preview");
  preview.innerHTML = "";
  const fileType = file.type.split("/")[0];
  let previewElement;

  if (fileType === "image") {
    previewElement = document.createElement("img");
    previewElement.src = URL.createObjectURL(file);
  } else if (fileType === "video") {
    previewElement = document.createElement("video");
    previewElement.controls = true;
    previewElement.src = URL.createObjectURL(file);
  } else {
    previewElement = document.createElement("div");
    previewElement.className = "file";
    previewElement.innerText = file.name;
  }

  preview.appendChild(previewElement);
}

function updateHistory(url) {
  const history = document.getElementById("history");
  history.innerHTML = "";

  const link = document.createElement("a");
  link.href = "#";
  link.textContent = url;
  link.addEventListener("click", function (e) {
    e.preventDefault();
    copyToClipboard(url);
  });

  history.appendChild(link);
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showPopup("Link Copied!", "success");
    })
    .catch((err) => {
      showPopup("Failed to Copy Link", "error");
    });
}

function saveToLocalStorage(url) {
  localStorage.setItem("uploadedFileUrl", url);
}

function loadHistory() {
  fetch("/history")
    .then((response) => response.json())
    .then((data) => {
      const historyContainer = document.getElementById("history");
      historyContainer.innerHTML = "";
      if (data.fileName && data.url) {
        const link = document.createElement("a");
        link.href = data.url;
        link.textContent = `${data.fileName} (${data.size})`;
        historyContainer.appendChild(link);
      } else if (data.message) {
        historyContainer.textContent = data.message;
      } else {
        historyContainer.textContent = "Unknown error";
      }
    })
    .catch((error) => {
      console.error("Error loading history:", error);
      const historyContainer = document.getElementById("history");
      historyContainer.textContent = "Error fetching history";
    });
}

function showPopup(message, type = "error") {
  const popup = document.createElement("div");
  popup.className = `popup ${type}`;
  popup.textContent = message;
  popup.style.animation = "slideDown 0.3s ease-out forwards";
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.animation = "fadeOut 0.5s ease-out forwards";
    setTimeout(() => {
      document.body.removeChild(popup);
    }, 500);
  }, 3000);
}

function fetchStats() {
  fetch("/files")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("totalFiles").textContent = data.totalFiles;
      document.getElementById("totalSize").textContent = data.totalSize;
    })
    .catch((error) => console.error("Error fetching stats:", error));
}

setInterval(fetchStats, 5000);
