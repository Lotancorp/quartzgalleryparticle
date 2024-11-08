// Variabel global
let extractedText = {}; // Menyimpan konten per file
let historyData = {}; // Menyimpan data riwayat per file

// Fungsi untuk escape karakter HTML
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
document.addEventListener("DOMContentLoaded", function() {
    // Kode JavaScript kamu di sini
});
// Fungsi untuk mengkonversi teks ke HTML tanpa mengubah line breaks
function convertTextToHTML(text) {
    const escapedText = escapeHTML(text);
    return escapedText; // Tidak perlu mengganti \n dengan <br>
}


// Fungsi untuk mengonversi HTML ke teks biasa dengan line breaks yang benar
function htmlToPlainText(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Ganti <br> dengan \n
    tempDiv.querySelectorAll('br').forEach(br => br.replaceWith('\n'));

    // Ganti elemen blok seperti <div>, <p>, <li>, dll. dengan \n
    const blockElements = ['div', 'p', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    blockElements.forEach(tag => {
        tempDiv.querySelectorAll(tag).forEach(el => {
            el.insertAdjacentText('afterend', '\n');
        });
    });

    // Ambil teks biasa dari tempDiv
    let plainText = tempDiv.innerText;

    // Ganti entitas HTML seperti &nbsp; dengan spasi
    plainText = plainText.replace(/&nbsp;/g, ' ');

    // Trim untuk menghilangkan spasi atau line breaks di awal dan akhir
    return plainText.trim();
}

// Fungsi untuk mengambil teks dari file yang diunggah
function extractText() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    const searchResultsElement = document.getElementById('searchResults');

    console.log(`Files selected: ${files.length}`);

    if (files.length === 0) {
        alert('Please select a file to extract text.');
        return;
    }

    const readerPromises = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Processing file: ${file.name}`);
        const reader = new FileReader();
        readerPromises.push(new Promise((resolve) => {
            reader.onload = () => {
                const fileContent = reader.result;
                const fileName = file.name;

                console.log(`File content length: ${fileContent.length}`);

                // Periksa apakah file sudah diimpor sebelumnya
                if (extractedText.hasOwnProperty(fileName)) {
                    const overwrite = confirm(`File "${fileName}" has already been imported. Do you want to overwrite it?`);
                    if (!overwrite) {
                        console.log(`Skipped overwriting file: ${fileName}`);
                        resolve();
                        return;
                    }
                }

                // Simpan konten ke dalam objek extractedText
                extractedText[fileName] = fileContent;
                console.log(`Content saved for file: ${fileName}`);

                // Inisialisasi historyData untuk file ini
                if (!historyData[fileName]) {
                    historyData[fileName] = [];
                    console.log(`History initialized for file: ${fileName}`);
                }

                // Buat atau perbarui tab
                createOrUpdateTab(fileName, fileContent);
                console.log(`Tab created/updated for file: ${fileName}`);

                resolve();
            };
            reader.onerror = () => {
                console.error(`Error reading file: ${file.name}`);
                alert(`Error reading file: ${file.name}`);
                resolve();
            };
            reader.readAsText(file);
        }));
    }

    Promise.all(readerPromises).then(() => {
        searchResultsElement.innerHTML = ''; // Hapus hasil pencarian sebelumnya
        console.log('All files have been processed.');
    }).catch(error => {
        console.error('Error reading files:', error);
        alert('An error occurred while reading the files.');
    });
}

// Fungsi untuk membuat atau memperbarui tab
function createOrUpdateTab(fileName, content) {
    console.log(`Creating or updating tab for file: ${fileName}`);
    const tabButtons = document.getElementById('tabButtons');
    const tabContent = document.getElementById('tabContent');

    // Cek apakah tab sudah ada
    let tabButton = document.querySelector(`.tab-button[data-file-name="${fileName}"]`);
    let tabPane = document.getElementById(`tab-${fileName}`);

    if (tabButton && tabPane) {
        // Jika tab sudah ada, perbarui kontennya
        tabPane.innerHTML = convertTextToHTML(content);
    } else {
        // Jika tab belum ada, buat tab baru
        // Buat tombol tab
        tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.textContent = fileName;
        tabButton.setAttribute('data-file-name', fileName);
        tabButton.onclick = () => openTab(fileName);

        // Tambahkan tombol close
        const closeButton = document.createElement('span');
        closeButton.className = 'close-tab';
        closeButton.innerHTML = '&times;'; // Simbol silang (×)
        closeButton.setAttribute('aria-label', 'Close Tab');
        closeButton.onclick = (event) => {
            event.stopPropagation(); // Mencegah event tab terbuka saat klik close
            closeTab(fileName);
        };

        tabButton.appendChild(closeButton);
        tabButtons.appendChild(tabButton);

        // Buat konten tab
        tabPane = document.createElement('div');
        tabPane.className = 'tab-pane';
        tabPane.id = `tab-${fileName}`;
        tabPane.dataset.fileName = fileName; // Simpan nama file dalam atribut data
        tabPane.innerHTML = convertTextToHTML(content); // Gunakan innerHTML dengan konversi teks ke HTML

        tabContent.appendChild(tabPane);
    }

    // Aktifkan tab yang baru dibuat atau diperbarui
    openTab(fileName);
    console.log(`Tab for file: ${fileName} created/updated.`);
}

// Fungsi untuk membuka tab tertentu
function openTab(fileName) {
    // Hapus kelas 'active' dari semua tombol tab
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Sembunyikan semua konten tab
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
        pane.classList.remove('active');
    });

    // Aktifkan tombol tab yang dipilih
    const activeButton = document.querySelector(`.tab-button[data-file-name="${fileName}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Tampilkan konten tab yang dipilih
    const activePane = document.getElementById(`tab-${fileName}`);
    if (activePane) {
        activePane.classList.add('active');
    }
}

// Fungsi untuk mendapatkan informasi tab aktif
function getActiveTabInfo() {
    const activePane = document.querySelector('.tab-pane.active');
    if (!activePane) return null;
    const fileName = activePane.dataset.fileName;
    return {
        fileName,
        pane: activePane
    };
}

// Fungsi untuk menutup tab
function closeTab(fileName) {
    // Hapus data dari extractedText dan historyData
    delete extractedText[fileName];
    delete historyData[fileName];

    // Hapus tombol tab
    const tabButton = document.querySelector(`.tab-button[data-file-name="${fileName}"]`);
    if (tabButton) {
        tabButton.parentNode.removeChild(tabButton);
    }

    // Hapus konten tab
    const tabPane = document.getElementById(`tab-${fileName}`);
    if (tabPane) {
        tabPane.parentNode.removeChild(tabPane);
    }

    // Jika tab yang ditutup adalah yang aktif, aktifkan tab lain
    if (tabButton && tabButton.classList.contains('active')) {
        const remainingTabs = document.querySelectorAll('.tab-button');
        if (remainingTabs.length > 0) {
            const firstTab = remainingTabs[0];
            const firstFileName = firstTab.getAttribute('data-file-name');
            openTab(firstFileName);
        }
    }
}

// Fungsi untuk membuka popup "Particle Data"
function openEditPopup() {
    const activeTabInfo = getActiveTabInfo();
    if (!activeTabInfo) {
        return;
    }

    const { fileName } = activeTabInfo;
    const content = extractedText[fileName];
    const popupWidth = 600;
    const popupHeight = 500; // Menyesuaikan tinggi untuk menampung checkbox
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const popupLeft = window.screenX + (screenWidth / 2) - (popupWidth / 2);
    const popupTop = window.screenY + (screenHeight / 2) - (popupHeight / 2);

    const popup = window.open("", "View PARTICLE Data", `width=${popupWidth},height=${popupHeight},top=${popupTop},left=${popupLeft},resizable=yes,scrollbars=yes`);

    // Menghasilkan array [PARTICLE1] hingga [PARTICLE3073]
    const totalParticles = 3073;
    const particleList = [];
    for (let i = 1; i <= totalParticles; i++) {
        particleList.push(`[PARTICLE${i}]`);
    }

    // Ekstrak baris [PARTICLE***] yang ada dalam content
    const existingParticles = content.match(/^\[PARTICLE\d+\]$/gm) || [];

    // Membuat list item dengan penandaan warna (hijau jika tidak ada, merah jika ada)
    let listItems = '';
    particleList.forEach(particle => {
        const isPresent = existingParticles.includes(particle);
        const colorStyle = isPresent ? 'color: red;' : 'color: green;';
        listItems += `<li style="${colorStyle}">${particle}</li>`;
    });

    // Konten popup
    popup.document.write(`
        <html>
        <head>
            <title>View PARTICLE Data</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                #searchInput { width: 100%; padding: 8px; margin-bottom: 10px; }
                #particleList { list-style-type: none; padding: 0; max-height: 300px; overflow-y: auto; }
                #particleList li { padding: 5px 0; border-bottom: 1px solid #ccc; }
                .filter-checkboxes { margin-bottom: 10px; }
                .filter-checkboxes label { margin-right: 15px; }
            </style>
        </head>
        <body>
            <h2>PARTICLE Entries</h2>
            <div class="filter-checkboxes">
                <label><input type="checkbox" id="showPresent" checked> Not Available </label>
                <label><input type="checkbox" id="showAbsent" checked> Available </label>
            </div>
            <input type="text" id="searchInput" placeholder="Search PARTICLE..." onkeyup="filterList()">
            <ul id="particleList">
                ${listItems}
            </ul>
            <script>
                const particleList = ${JSON.stringify(particleList)};
                const existingParticles = ${JSON.stringify(existingParticles)};

                document.getElementById('showPresent').addEventListener('change', filterList);
                document.getElementById('showAbsent').addEventListener('change', filterList);

                function filterList() {
                    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
                    const showPresent = document.getElementById('showPresent').checked;
                    const showAbsent = document.getElementById('showAbsent').checked;
                    const list = document.getElementById('particleList');
                    list.innerHTML = '';
                    particleList.forEach(particle => {
                        if (particle.toLowerCase().includes(searchTerm)) {
                            const isPresent = existingParticles.includes(particle);
                            const colorStyle = isPresent ? 'color: red;' : 'color: green;';
                            const shouldShow = (isPresent && showPresent) || (!isPresent && showAbsent);
                            if (shouldShow) {
                                const listItem = document.createElement('li');
                                listItem.style = colorStyle;
                                listItem.textContent = particle;
                                list.appendChild(listItem);
                            }
                        }
                    });
                }
            </script>
        </body>
        </html>
    `);
    popup.document.close(); // Pastikan dokumen dimuat
}

// Fungsi untuk toggle tema gelap
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
}

// Fungsi untuk melakukan pencarian teks
function searchText() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const searchResultsElement = document.getElementById('searchResults');

    console.log(`Search Term: ${searchTerm}`);

    const activeTabInfo = getActiveTabInfo();
    console.log('Active Tab Info:', activeTabInfo);

    if (!activeTabInfo) {
        alert('No active tab. Please select a tab.');
        return;
    }

    const { fileName, pane } = activeTabInfo;
    console.log(`Searching in file: ${fileName}`);

    if (!searchTerm) {
        searchResultsElement.innerHTML = '';
        pane.innerHTML = convertTextToHTML(extractedText[fileName]); // Reset ke konten asli
        return;
    }

    // Escape special characters in searchTerm to avoid regex errors
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');

    const content = extractedText[fileName];
    console.log(`Content Length: ${content.length}`);

    const lines = content.split('\n');
    const matchedLines = lines.filter(line => line.toLowerCase().includes(searchTerm.toLowerCase()));
    const count = matchedLines.length;

    console.log(`Number of matches: ${count}`);

    if (count === 0) {
        pane.innerHTML = '<p>No matches found.</p>';
        searchResultsElement.innerHTML = `Search results for "<strong>${escapeHTML(searchTerm)}</strong>": ${count} found in <strong>${escapeHTML(fileName)}</strong>`;
        return;
    }

    // Menyoroti hasil pencarian dalam setiap baris yang cocok
    const highlightedLines = matchedLines.map(line => {
        return escapeHTML(line).replace(regex, '<span class="highlight">$1</span>');
    });

    // Gabungkan baris yang cocok dengan <br>
    const highlightedText = highlightedLines.join('<br>');

    pane.innerHTML = highlightedText;

    searchResultsElement.innerHTML = `Search results for "<strong>${escapeHTML(searchTerm)}</strong>": ${count} found in <strong>${escapeHTML(fileName)}</strong>`;
}

// Fungsi untuk membersihkan pencarian
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';

    const activeTabInfo = getActiveTabInfo();
    if (!activeTabInfo) return;

    const { fileName, pane } = activeTabInfo;
    pane.innerHTML = convertTextToHTML(extractedText[fileName]); // Reset ke konten asli
}

// Fungsi untuk filter data berdasarkan select
function filterData() {
    const filterValue = document.getElementById('filterSelect').value;
    if (!filterValue) {
        const activeTabInfo = getActiveTabInfo();
        if (activeTabInfo) {
            const { fileName, pane } = activeTabInfo;
            pane.innerHTML = convertTextToHTML(extractedText[fileName]); // Menggunakan innerHTML
        }
        return;
    }

    const activeTabInfo = getActiveTabInfo();
    if (!activeTabInfo) {
        alert('No active tab. Please select a tab.');
        return;
    }

    const { fileName, pane } = activeTabInfo;

    const lines = extractedText[fileName].split('\n');
    const filteredLines = lines.filter(line => line.includes(filterValue));
    pane.innerHTML = convertTextToHTML(filteredLines.join('\n')); // Use innerHTML
}

// Fungsi untuk menangani input data baru
function handleDataInput() {
    const activeTabInfo = getActiveTabInfo();
    if (!activeTabInfo) {
        alert('No active tab. Please select a tab.');
        return;
    }

    const { fileName, pane } = activeTabInfo;

    let nomor;

    if (reserveCheckbox.checked) {
        nomor = reserveNumberInput.value.trim();
        if (!nomor) {
            alert('Please enter a number in the Reserve Number field.');
            return;
        }
    } else {
        nomor = nomorInput.value.trim();
        if (!nomor) {
            alert('Please fill in the Nomor field.');
            return;
        }
    }

    const nameOfSkin = nameOfSkinInput.value.trim();
    if (!nameOfSkin) {
        alert('Please enter the Name of Skin.');
        return;
    }

    const lokasiFolder = document.getElementById('inputLokasiFolder').value.trim();
    const namaSpt = document.getElementById('inputNamaSpt').value.trim();
    const masterFolder = document.getElementById('inputMasterFolder').value.trim();
    const predefinedFolder = document.getElementById('predefinedFolderSelect').value.trim();

    if (!lokasiFolder || !namaSpt) {
        alert('Please fill in all required fields before submitting.');
        return;
    }

    // Inisialisasi folderPath
    let folderPath = '.\\Chef';

    if (masterFolder) {
        folderPath += `\\${masterFolder.toUpperCase()}`;
    } else {
        folderPath += '\\QG\\SPT\\QGN';
    }

    if (predefinedFolder) {
        folderPath += `\\${predefinedFolder.toUpperCase()}_${lokasiFolder.toUpperCase()}`;
    } else {
        folderPath += `\\${lokasiFolder.toUpperCase()}`;
    }

    const particlePath = `${folderPath}\\${namaSpt}.spt`;

    // Buat data baru
    let indexLine = `INDEX = ${nomor} ;${nameOfSkin}`;
    let absaxisLine = `ABSAXIS=0`;

    const newData = `[PARTICLE${nomor}]
${indexLine}
${absaxisLine}
PARTICLE=${particlePath}`;

    // Simpan data baru ke historyData
    if (!historyData[fileName]) {
        historyData[fileName] = [];
    }
    historyData[fileName].push(newData);

    // Perbarui extractedText dengan data baru
    if (!extractedText[fileName]) {
        extractedText[fileName] = '';
    }
    extractedText[fileName] += '\n' + newData;

    // Perbarui konten tab
    pane.innerHTML = convertTextToHTML(extractedText[fileName]);

    // Logika penambahan nomor jika "Reserve" dicentang
    if (reserveCheckbox.checked) {
        let nextNumber = parseInt(nomor, 10) + 1;
        reserveNumberInput.value = nextNumber;
        // Perbarui warna latar belakang berdasarkan ada tidaknya nomor berikutnya di extractedText
        const particleRegex = new RegExp(`\\[PARTICLE${nextNumber}\\]`, 'g');
        if (particleRegex.test(extractedText[fileName])) {
            reserveNumberInput.classList.add('invalid');
            reserveNumberInput.classList.remove('valid');
        } else {
            reserveNumberInput.classList.add('valid');
            reserveNumberInput.classList.remove('invalid');
        }
    }

    // Opsional: Reset input "Name of Skin" setelah submit
    // nameOfSkinInput.value = '';
}

// Fungsi untuk scroll ke atas
function scrollToTop() {
    const activeTabInfo = getActiveTabInfo();
    if (!activeTabInfo) {
        alert('No active tab. Please select a tab.');
        return;
    }
    const { pane } = activeTabInfo;
    pane.scrollTop = 0;
}

// Fungsi untuk scroll ke bawah
function scrollToBottom() {
    const activeTabInfo = getActiveTabInfo();
    if (!activeTabInfo) {
        alert('No active tab. Please select a tab.');
        return;
    }
    const { pane } = activeTabInfo;
    pane.scrollTop = pane.scrollHeight;
}

// Fungsi untuk membuka popup "History"
function openHistoryPopup() {
    const popupWidth = 600;
    const popupHeight = 400;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const popupLeft = window.screenX + (screenWidth / 2) - (popupWidth / 2);
    const popupTop = window.screenY + (screenHeight / 2) - (popupHeight / 2);

    const popup = window.open("", "History", `width=${popupWidth},height=${popupHeight},top=${popupTop},left=${popupLeft},resizable=yes,scrollbars=yes`);

    // Konten popup
    let historyContent = '';
    const fileNames = Object.keys(historyData);
    if (fileNames.length === 0) {
        historyContent = '<p>No data added yet.</p>';
    } else {
        historyContent = '<ul>';
        fileNames.forEach(fileName => {
            const fileHistory = historyData[fileName];
            if (fileHistory.length === 0) {
                historyContent += `<li><strong>${fileName}:</strong> No data added.</li>`;
            } else {
                historyContent += `<li><strong>${fileName}:</strong><ul>`;
                fileHistory.forEach((data, index) => {
                    historyContent += `<li><pre>${escapeHTML(data)}</pre></li>`;
                });
                historyContent += `</ul></li>`;
            }
        });
        historyContent += '</ul>';
    }

    popup.document.write(`
        <html>
        <head>
            <title>History of Added Data</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                ul { list-style-type: none; padding: 0; }
                li { margin-bottom: 15px; }
                pre { background-color: #f0f0f0; padding: 10px; }
                strong { display: block; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h2>History of Added Data</h2>
            ${historyContent}
        </body>
        </html>
    `);
    popup.document.close(); // Pastikan dokumen dimuat
}

// Fungsi untuk menyimpan data ke satu file .ini
function saveData() {
    let combinedData = '';

    // Iterasi melalui setiap file dalam extractedText
    for (const fileName in extractedText) {
        if (extractedText.hasOwnProperty(fileName)) {
            combinedData += extractedText[fileName].trim() + '\n\n'; // Tambahkan dua newline sebagai pemisah antar file
        }
    }

    // Buat Blob dari data
    const blob = new Blob([combinedData.trim()], { type: 'text/plain' });

    // Buat URL untuk Blob
    const url = URL.createObjectURL(blob);

    // Buat elemen <a> untuk mendownload file
    const a = document.createElement('a');
    a.href = url;
    a.download = 'particle.ini'; // Nama file yang diunduh
    document.body.appendChild(a);
    a.click();

    // Hapus elemen <a> setelah diunduh
    document.body.removeChild(a);

    // Hapus objek URL
    URL.revokeObjectURL(url);

}


// Fungsi untuk membatalkan aksi terakhir
function undoLastAction() {
    const activeTabInfo = getActiveTabInfo();
    if (!activeTabInfo) {
        alert('No active tab. Please select a tab.');
        return;
    }
  
    const { fileName, pane } = activeTabInfo;
  
    if (!historyData[fileName] || historyData[fileName].length === 0) {
        alert('No actions to undo in this file.');
        return;
    }
  
    // Hapus data terakhir dari historyData
    historyData[fileName].pop();

    // Rebuild extractedText from historyData
    let rebuiltContent = '';
    historyData[fileName].forEach(data => {
        rebuiltContent += data + '\n';
    });
    extractedText[fileName] = rebuiltContent.trim();

    // Perbarui konten tab
    pane.innerHTML = convertTextToHTML(extractedText[fileName]);

    // Jika "Reserve" dicentang, kurangi nilai nomor
    if (reserveCheckbox.checked) {
        let currentNumber = parseInt(reserveNumberInput.value, 10);
        if (!isNaN(currentNumber) && currentNumber > 0) {
            reserveNumberInput.value = currentNumber - 1;
            // Perbarui warna latar belakang
            const particleRegex = new RegExp(`\\[PARTICLE${reserveNumberInput.value}\\]`, 'g');
            if (particleRegex.test(extractedText[fileName])) {
                reserveNumberInput.classList.add('invalid');
                reserveNumberInput.classList.remove('valid');
            } else {
                reserveNumberInput.classList.add('valid');
                reserveNumberInput.classList.remove('invalid');
            }
        }
    }

    console.log(`Undo dilakukan untuk file: ${fileName}`);
    alert('Aksi terakhir telah dibatalkan.');
}

// Slider functionality
let currentSlide = 0;

function showSlide(index) {
    const slides = document.querySelectorAll('.image-slider .slide');
    const dots = document.querySelectorAll('.dots .dot');
    const totalSlides = slides.length;

    if (index >= totalSlides) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = totalSlides - 1;
    } else {
        currentSlide = index;
    }

    const slidesContainer = document.querySelector('.image-slider .slides');
    slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;

    // Update active dot
    dots.forEach(dot => dot.classList.remove('active'));
    if (dots[currentSlide]) {
        dots[currentSlide].classList.add('active');
    }
}

function moveSlide(direction) {
    showSlide(currentSlide + direction);
}

// Initialize dots
function initializeDots() {
    const slides = document.querySelectorAll('.image-slider .slide');
    const dotsContainer = document.querySelector('.dots');
    if (!dotsContainer) return; // Tambahkan pengecekan untuk menghindari error
    dotsContainer.innerHTML = ''; // Clear existing dots

    slides.forEach((slide, index) => {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.onclick = () => showSlide(index);
        dotsContainer.appendChild(dot);
    });

    showSlide(currentSlide); // Initialize active dot
}

// Optional: Auto slide every 5 seconds
let slideInterval = setInterval(() => {
    moveSlide(1);
}, 5000);

// Pause auto slide on mouse hover
const imageSlider = document.querySelector('.image-slider');
if (imageSlider) { // Tambahkan pengecekan untuk menghindari error
    imageSlider.addEventListener('mouseover', () => {
        clearInterval(slideInterval);
    });

    imageSlider.addEventListener('mouseout', () => {
        slideInterval = setInterval(() => {
            moveSlide(1);
        }, 5000);
    });
}

// Inisialisasi dots saat DOM dimuat
document.addEventListener('DOMContentLoaded', initializeDots);

// Event listener untuk tombol "View History", "Undo", dan "Save Data"
document.getElementById('viewHistoryButton').addEventListener('click', openHistoryPopup);
document.getElementById('saveButton').addEventListener('click', saveData);
document.getElementById('undoButton').addEventListener('click', undoLastAction);

// Event listener untuk tombol scroll
document.getElementById('scrollTopButton').addEventListener('click', scrollToTop);
document.getElementById('scrollBottomButton').addEventListener('click', scrollToBottom);

// Referensi ke elemen input
const nomorInput = document.getElementById('inputNomor'); // Referensi ke textbox "Nomor:"
const reserveCheckbox = document.getElementById('reserveCheckbox');
const reserveNumberInput = document.getElementById('reserveNumberInput');
const nameOfSkinInput = document.getElementById('nameOfSkinInput');
const editDirectlySwitch = document.getElementById('editDirectlySwitch'); // Referensi ke switch "Edit Langsung"

// Event listener untuk checkbox "Reserve"
reserveCheckbox.addEventListener('change', function() {
    if (this.checked) {
        reserveNumberInput.disabled = false;
        reserveNumberInput.focus();
        // Nonaktifkan textbox "Nomor:"
        nomorInput.disabled = true;
        nomorInput.value = ''; // Opsional: mengosongkan input
    } else {
        reserveNumberInput.disabled = true;
        reserveNumberInput.value = '';
        reserveNumberInput.classList.remove('valid', 'invalid');
        // Aktifkan textbox "Nomor:"
        nomorInput.disabled = false;
    }
});

// Event listener untuk input di Reserve number textbox
reserveNumberInput.addEventListener('input', function() {
    // Allow only numbers
    this.value = this.value.replace(/\D/g, '');

    const activeTabInfo = getActiveTabInfo();
    if (!activeTabInfo) {
        alert('No active tab. Please select a tab.');
        this.value = '';
        return;
    }

    const { fileName } = activeTabInfo;
    const content = extractedText[fileName];

    if (!content) {
        alert('Please extract data first.');
        this.value = '';
        return;
    }

    const enteredNumber = this.value.trim();
    if (enteredNumber === '') {
        this.classList.remove('valid', 'invalid');
        return;
    }

    // Check if the number exists in the extracted PARTICLE data
    const particleRegex = new RegExp(`\\[PARTICLE${enteredNumber}\\]`, 'g');
    if (particleRegex.test(content)) {
        // Number exists in extracted data
        this.classList.add('invalid');
        this.classList.remove('valid');
    } else {
        // Number does not exist in extracted data
        this.classList.add('valid');
        this.classList.remove('invalid');
    }
});

// Event listener untuk tombol "Submit Particle" inputs for Enter key
const dataInputFields = [
    document.getElementById('inputNomor'),
    document.getElementById('inputNamaSpt'),
    document.getElementById('inputLokasiFolder'),
    document.getElementById('inputMasterFolder'),
    document.getElementById('predefinedFolderSelect'),
    document.getElementById('nameOfSkinInput'),
    document.getElementById('reserveNumberInput'),
];

dataInputFields.forEach(input => {
    if (input) { // Pastikan elemen ada
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Mencegah tindakan default seperti submit form
                handleDataInput();
            }
        });
    }
});

// Event listener untuk tombol "Search" inputs for Enter key
const searchInputField = document.getElementById('searchInput');
if (searchInputField) {
    searchInputField.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Mencegah tindakan default seperti submit form
            searchText();
        }
    });
}

// Fungsi untuk membuka popup "SPT Editor"
function openSPTEditor() {
    const popupWidth = 720;
    const popupHeight = 700; // Sesuaikan tinggi sesuai kebutuhan
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const popupLeft = window.screenX + (screenWidth / 2) - (popupWidth / 2);
    const popupTop = window.screenY + (screenHeight / 2) - (popupHeight / 2);

    // Buka jendela popup baru
    const popup = window.open("", "SPT Editor", `width=${popupWidth},height=${popupHeight},top=${popupTop},left=${popupLeft},resizable=yes,scrollbars=yes`);

    // Pastikan popup dibuka
    if (!popup) {
        alert('Popup diblokir! Silakan izinkan popups untuk situs ini.');
        return;
    }

    // Konten HTML untuk popup
    const popupContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>SPT Editor</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 20px; 
                    background-color: #f9f9f9; 
                }
                h2 { 
                    text-align: center; 
                    margin-bottom: 20px; 
                }
                .editor-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .columns {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .column {
                    display: flex;
                    flex-direction: column;
                }
                .column label {
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                .column textarea, .column input {
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .buttons {
                    display: flex;
                    gap: 10px;
                }
                .buttons button {
                    padding: 10px 20px;
                    background-color: #28a745;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                .buttons button:hover {
                    background-color: #218838;
                }
                .buttons button.validate-btn {
                    background-color: #17a2b8;
                }
                .buttons button.validate-btn:hover {
                    background-color: #138496;
                }
                .buttons button.copy-btn {
                    background-color: #007bff;
                }
                .buttons button.copy-btn:hover {
                    background-color: #0069d9;
                }
                #combinedOutput {
                    background-color: #e9ecef;
                }
            </style>
        </head>
        <body>
            <h2>SPT Editor</h2>
            <div class="editor-container">
                <!-- Kolom 1: Input Teks -->
                <div class="column">
                    <label for="textInput">Input Teks:</label>
                    <textarea id="textInput" placeholder="Masukkan teks di sini..." rows="8"></textarea>
                </div>
                <!-- Kolom 2: Input Angka -->
                <div class="column">
                    <label for="numberInput">SPT Number:</label>
                    <input type="number" id="numberInput" placeholder="Masukkan nomor SPT..." min="1">
                </div>
                <!-- Tombol Combine dan Validate -->
                <div class="buttons">
                    <button id="combineButton">Combine</button>
                    <button id="validateButton" class="validate-btn">Validate</button>
                </div>
                <!-- Kolom 3: Output Kombinasi -->
                <div class="column">
                    <label for="combinedOutput">Kombinasi:</label>
                    <textarea id="combinedOutput" readonly placeholder="Hasil kombinasi akan muncul di sini..." rows="8"></textarea>
                </div>
                <!-- Tombol Salin ke Clipboard -->
                <div class="buttons">
                    <button id="copyButton" class="copy-btn">Salin ke Clipboard</button>
                </div>
            </div>
            <script>
                // Fungsi untuk menggabungkan teks dan angka sesuai aturan
                document.getElementById('combineButton').addEventListener('click', function() {
                    const textInput = document.getElementById('textInput').value;
                    const numberInput = parseInt(document.getElementById('numberInput').value, 10);

                    if (isNaN(numberInput)) {
                        alert('Silakan masukkan nomor SPT yang valid.');
                        return;
                    }

                    if (textInput.trim() === '') {
                        alert('Silakan masukkan teks terlebih dahulu.');
                        return;
                    }

                    // Split teks menjadi baris-baris
                    const lines = textInput.split('\\n');
                    let combinedText = '';
                    let currentNumber = numberInput;

                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i];

                        // Cek apakah baris mengandung [PARTICLE****]
                        const particleMatch = line.match(/^\\[PARTICLE(\\d+)\\]$/);
                        if (particleMatch) {
                            // Ganti [PARTICLE****] dengan [PARTICLE{currentNumber}]
                            line = \`[PARTICLE\${currentNumber}]\`;
                            combinedText += line + '\\n';

                            // Cek baris berikutnya untuk INDEX
                            if (i + 1 < lines.length) {
                                let nextLine = lines[i + 1];
                                const indexMatch = nextLine.match(/^INDEX\\s*=\\s*(\\d+)(.*)$/);
                                if (indexMatch) {
                                    // Ganti INDEX = **** dengan INDEX = {currentNumber}
                                    nextLine = \`INDEX = \${currentNumber}\${indexMatch[2]}\`;
                                    combinedText += nextLine + '\\n';
                                    i++; // Skip baris INDEX karena sudah diproses
                                }
                            }

                            currentNumber++; // Inkrement setelah mengganti pasangan [PARTICLE] dan INDEX
                            continue;
                        }

                        // Jika baris tidak mengandung [PARTICLE****], biarkan tetap
                        combinedText += line + '\\n';
                    }

                    // Trim akhir untuk menghindari baris kosong
                    combinedText = combinedText.trim();

                    // Tampilkan hasil kombinasi di Kolom 3
                    document.getElementById('combinedOutput').value = combinedText;
                });

                // Fungsi untuk menyalin isi Kolom 3 ke clipboard
                document.getElementById('copyButton').addEventListener('click', function() {
                    const combinedText = document.getElementById('combinedOutput').value.trim();
                    if (combinedText === '') {
                        alert('Tidak ada teks untuk disalin.');
                        return;
                    }

                    // Salin ke clipboard
                    navigator.clipboard.writeText(combinedText).then(() => {
                        alert('Teks berhasil disalin ke clipboard.');
                    }).catch(err => {
                        console.error('Gagal menyalin teks: ', err);
                        alert('Gagal menyalin teks.');
                    });
                });

                // Tambahkan event listener untuk tombol "Validate"
                document.getElementById('validateButton').addEventListener('click', function() {
                    // Panggil openEditPopup() dari window.opener
                    if (window.opener && typeof window.opener.openEditPopup === 'function') {
                        window.opener.openEditPopup();
                    } else {
                        alert('Tidak dapat mengakses fungsi "openEditPopup()" dari window utama.');
                    }
                });
            </script>
        </body>
        </html>
    `;
    // Tulis konten ke dalam popup
    popup.document.write(popupContent);
    popup.document.close(); // Pastikan dokumen dimuat
}


// Event listener untuk toggle edit langsung
editDirectlySwitch.addEventListener('change', function() {
    const activeTabInfo = getActiveTabInfo();
    if (!activeTabInfo) {
        alert('No active tab. Please select a tab.');
        this.checked = false;
        return;
    }

    const { fileName, pane } = activeTabInfo;

    if (this.checked) {
        // Aktifkan mode edit
        pane.contentEditable = true;
        pane.style.border = '1px solid #007bff'; // Indikasi visual mode edit
        pane.focus();
        console.log(`Mode edit diaktifkan untuk file: ${fileName}`);
    } else {
        // Nonaktifkan mode edit
        pane.contentEditable = false;
        pane.style.border = ''; // Hapus border

        // Ambil teks biasa tanpa tag HTML
        const editedContent = pane.textContent.trim();

        console.log(`Konten yang diedit: \n${editedContent}`);

        // Simpan perubahan ke extractedText
        extractedText[fileName] = editedContent;
        console.log(`Perubahan disimpan untuk file: ${fileName}`);
        console.log(`Isi extractedText[fileName]:\n${extractedText[fileName]}`);

        // Perbarui kembali pane untuk memastikan format yang konsisten
        pane.innerHTML = convertTextToHTML(extractedText[fileName]);

    }
});
