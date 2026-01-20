/**
 * Sinem Diyet Hesaplama Sistemi
 * Ana Uygulama Mantığı
 */

// ========================================
// Uygulama Durumu
// ========================================
const appState = {
    currentPatientId: null,
    gender: 'male',
    height: 170,
    weight: 70,
    age: 30,
    patientName: '',
    exchanges: {
        milk: 2,
        eyp: 4,
        etk: 9,
        vegetable: 1,
        fruit: 1,
        fat: 3,
        yt: 1,
        serbest: 0
    }
};

// ========================================
// DOM Elemanları
// ========================================
const elements = {
    // Danışan seçici
    patientSelect: document.getElementById('patient-select'),
    patientSearch: document.getElementById('patient-search'),
    patientName: document.getElementById('patient-name'),
    btnNewPatient: document.getElementById('btn-new-patient'),
    btnSavePatient: document.getElementById('btn-save-patient'),
    btnDeletePatient: document.getElementById('btn-delete-patient'),
    btnViewHistory: document.getElementById('btn-view-history'),
    btnSaveRecord: document.getElementById('btn-save-record'),

    // Danışan bilgileri
    genderBtns: document.querySelectorAll('.gender-btn'),
    heightInput: document.getElementById('height'),
    weightInput: document.getElementById('weight'),
    ageInput: document.getElementById('age'),

    // Sonuçlar
    bmiValue: document.getElementById('bmi-value'),
    bmiStatus: document.getElementById('bmi-status'),
    idealWeight: document.getElementById('ideal-weight'),
    bmrHB: document.getElementById('bmr-hb'),
    bmrMSJ: document.getElementById('bmr-msj'),

    // TDEE
    tdee1: document.getElementById('tdee-1'),
    tdee2: document.getElementById('tdee-2'),
    tdee3: document.getElementById('tdee-3'),
    tdee4: document.getElementById('tdee-4'),
    tdee5: document.getElementById('tdee-5'),

    // Besin tablosu
    exchangeInputs: document.querySelectorAll('.exchange-input'),

    // Toplamlar
    totalD: document.getElementById('total-d'),
    totalCarb: document.getElementById('total-carb'),
    totalProtein: document.getElementById('total-protein'),
    totalFat: document.getElementById('total-fat'),

    // Kalori ve makrolar
    totalCalories: document.getElementById('total-calories'),
    carbPercent: document.getElementById('carb-percent'),
    proteinPercent: document.getElementById('protein-percent'),
    fatPercent: document.getElementById('fat-percent'),
    carbBar: document.getElementById('carb-bar'),
    proteinBar: document.getElementById('protein-bar'),
    fatBar: document.getElementById('fat-bar'),
    carbGrams: document.getElementById('carb-grams'),
    proteinGrams: document.getElementById('protein-grams'),
    fatGrams: document.getElementById('fat-grams'),
    carbKcal: document.getElementById('carb-kcal'),
    proteinKcal: document.getElementById('protein-kcal'),
    fatKcal: document.getElementById('fat-kcal'),

    // Modal
    historyModal: document.getElementById('history-modal'),
    historyContent: document.getElementById('history-content'),
    closeHistory: document.getElementById('close-history'),

    // Temalar
    themeBtns: document.querySelectorAll('.theme-btn')
};

// ========================================
// Tema Yönetimi
// ========================================
function initTheme() {
    const savedTheme = localStorage.getItem('diet-app-theme') || 'premium-dark';
    setTheme(savedTheme);
}

function setTheme(themeId) {
    document.body.setAttribute('data-theme', themeId);
    localStorage.setItem('diet-app-theme', themeId);

    // Butonları güncelle
    elements.themeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.themeId === themeId);
    });
}

function loadPatientList(searchTerm = '') {
    const patients = getPatients();
    elements.patientSelect.innerHTML = '<option value="">-- Yeni Danışan --</option>';

    const filteredPatients = searchTerm
        ? patients.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : patients;

    filteredPatients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = patient.name || 'İsimsiz Danışan';
        elements.patientSelect.appendChild(option);
    });
}

// ========================================
// Danışan Seç
// ========================================
function loadPatient(patientId) {
    if (!patientId) {
        // Yeni danışan modu
        appState.currentPatientId = null;
        appState.patientName = '';
        appState.gender = 'male';
        appState.height = 170;
        appState.weight = 70;
        appState.age = 30;
        appState.exchanges = {
            milk: 2, eyp: 4, etk: 9, vegetable: 1,
            fruit: 1, fat: 3, yt: 1, serbest: 0
        };
    } else {
        const patient = getPatientById(patientId);
        if (patient) {
            appState.currentPatientId = patient.id;
            appState.patientName = patient.name || '';
            appState.gender = patient.gender || 'male';
            appState.height = patient.height || 170;
            appState.weight = patient.weight || 70;
            appState.age = patient.age || 30;
            appState.exchanges = patient.exchanges || {
                milk: 2, eyp: 4, etk: 9, vegetable: 1,
                fruit: 1, fat: 3, yt: 1, serbest: 0
            };
        }
    }

    // UI güncelle
    updateUIFromState();
    updateAllCalculations();
}

// ========================================
// State'ten UI Güncelle
// ========================================
function updateUIFromState() {
    elements.patientName.value = appState.patientName;
    elements.heightInput.value = appState.height;
    elements.weightInput.value = appState.weight;
    elements.ageInput.value = appState.age;

    // Cinsiyet
    elements.genderBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gender === appState.gender);
    });

    // Besin değişimleri
    for (const [food, count] of Object.entries(appState.exchanges)) {
        const input = document.getElementById(`${food}-d`);
        if (input) input.value = count;
    }
}

// ========================================
// Danışan Kaydet
// ========================================
function saveCurrentPatient() {
    const patientData = {
        name: appState.patientName,
        gender: appState.gender,
        height: appState.height,
        weight: appState.weight,
        age: appState.age,
        exchanges: { ...appState.exchanges }
    };

    if (appState.currentPatientId) {
        // Mevcut danışanı güncelle
        updatePatient(appState.currentPatientId, patientData);
        alert('Danışan güncellendi!');
    } else {
        // Yeni danışan ekle
        if (!patientData.name) {
            patientData.name = prompt('Danışan adını girin:');
            if (!patientData.name) return;
            appState.patientName = patientData.name;
            elements.patientName.value = patientData.name;
        }
        const newPatient = addPatient(patientData);
        appState.currentPatientId = newPatient.id;
        loadPatientList();
        elements.patientSelect.value = newPatient.id;
        alert('Danışan kaydedildi!');
    }
}

// ========================================
// Danışan Hesaplamalarını Güncelle
// ========================================
function updatePatientCalculations() {
    const { height, weight, age, gender } = appState;

    // BKİ hesapla
    const bmi = calculateBMI(weight, height);
    const bmiCategory = getBMICategory(bmi);
    elements.bmiValue.textContent = bmi.toFixed(1);
    elements.bmiStatus.textContent = bmiCategory.status;
    elements.bmiStatus.className = 'result-status ' + bmiCategory.class;

    // İdeal kilo hesapla
    const idealWeight = calculateIdealWeight(height, age);
    elements.idealWeight.textContent = idealWeight.toFixed(1);

    // BMR hesapla - Harris-Benedict (önce)
    const bmrHB = calculateBMR_HarrisBenedict(weight, height, age, gender);
    elements.bmrHB.textContent = Math.round(bmrHB);

    // BMR hesapla - Mifflin-St Jeor
    const bmrMSJ = calculateBMR_MifflinStJeor(weight, height, age, gender);
    elements.bmrMSJ.textContent = Math.round(bmrMSJ);

    // TDEE hesapla (Harris-Benedict bazlı)
    const tdeeList = calculateAllTDEE(bmrHB);
    elements.tdee1.textContent = tdeeList[0].tdee + ' kcal';
    elements.tdee2.textContent = tdeeList[1].tdee + ' kcal';
    elements.tdee3.textContent = tdeeList[2].tdee + ' kcal';
    elements.tdee4.textContent = tdeeList[3].tdee + ' kcal';
    elements.tdee5.textContent = tdeeList[4].tdee + ' kcal';
}

// ========================================
// Besin Makrolarını Güncelle
// ========================================
function updateFoodMacros() {
    let totalExchanges = 0;

    // Her besin grubu için hesapla
    for (const [foodType, count] of Object.entries(appState.exchanges)) {
        const macros = calculateFoodMacros(foodType, count);

        totalExchanges += count;

        // Tablo hücrelerini güncelle
        const carbCell = document.getElementById(`${foodType}-carb`);
        const proteinCell = document.getElementById(`${foodType}-protein`);
        const fatCell = document.getElementById(`${foodType}-fat`);

        if (carbCell) carbCell.textContent = macros.carb !== null ? macros.carb : '-';
        if (proteinCell) proteinCell.textContent = macros.protein !== null ? macros.protein : '-';
        if (fatCell) fatCell.textContent = macros.fat !== null ? macros.fat : '-';
    }

    // Toplamları hesapla
    const totalMacros = calculateTotalMacros(appState.exchanges);
    const calories = calculateCalories(totalMacros);
    const percentages = calculateMacroPercentages(calories);

    // Tablo toplamlarını güncelle
    elements.totalD.textContent = totalExchanges;
    elements.totalCarb.textContent = totalMacros.carb;
    elements.totalProtein.textContent = totalMacros.protein;
    elements.totalFat.textContent = totalMacros.fat;

    // Kalori ve makro özeti güncelle
    elements.totalCalories.textContent = Math.round(calories.total);

    // Yüzdeleri güncelle
    elements.carbPercent.textContent = Math.round(percentages.carb) + '%';
    elements.proteinPercent.textContent = Math.round(percentages.protein) + '%';
    elements.fatPercent.textContent = Math.round(percentages.fat) + '%';

    // Barları güncelle
    elements.carbBar.style.width = percentages.carb + '%';
    elements.proteinBar.style.width = percentages.protein + '%';
    elements.fatBar.style.width = percentages.fat + '%';

    // Detayları güncelle
    elements.carbGrams.textContent = totalMacros.carb + 'g';
    elements.proteinGrams.textContent = totalMacros.protein + 'g';
    elements.fatGrams.textContent = totalMacros.fat + 'g';

    elements.carbKcal.textContent = Math.round(calories.carb) + ' kcal';
    elements.proteinKcal.textContent = Math.round(calories.protein) + ' kcal';
    elements.fatKcal.textContent = Math.round(calories.fat) + ' kcal';
}

// ========================================
// Tüm Hesaplamaları Güncelle
// ========================================
function updateAllCalculations() {
    updatePatientCalculations();
    updateFoodMacros();
}

// ========================================
// Geçmiş Göster
// ========================================
function showHistory() {
    if (!appState.currentPatientId) {
        alert('Önce bir danışan seçin veya kaydedin.');
        return;
    }

    const patient = getPatientById(appState.currentPatientId);
    if (!patient || !patient.history || patient.history.length === 0) {
        elements.historyContent.innerHTML = '<p class="empty-state">Henüz kayıt yok</p>';
    } else {
        let html = '';
        patient.history.slice().reverse().forEach(entry => {
            const date = new Date(entry.date).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            html += `
                <div class="history-entry">
                    <div class="history-date">${date}</div>
                    <div class="history-stats">
                        <div class="history-stat">
                            <div class="history-stat-value">${entry.weight} kg</div>
                            <div class="history-stat-label">Kilo</div>
                        </div>
                        <div class="history-stat">
                            <div class="history-stat-value">${entry.totalCalories} kcal</div>
                            <div class="history-stat-label">Kalori</div>
                        </div>
                        <div class="history-stat">
                            <div class="history-stat-value">${entry.bmi}</div>
                            <div class="history-stat-label">BKİ</div>
                        </div>
                    </div>
                </div>
            `;
        });
        elements.historyContent.innerHTML = html;
    }

    elements.historyModal.classList.add('active');
}

// ========================================
// Kayıt Ekle
// ========================================
function saveRecord() {
    if (!appState.currentPatientId) {
        // Önce danışanı kaydet
        saveCurrentPatient();
        if (!appState.currentPatientId) return;
    }

    const totalMacros = calculateTotalMacros(appState.exchanges);
    const calories = calculateCalories(totalMacros);
    const bmi = calculateBMI(appState.weight, appState.height);

    const entry = {
        weight: appState.weight,
        height: appState.height,
        bmi: bmi.toFixed(1),
        totalCalories: Math.round(calories.total),
        macros: totalMacros,
        exchanges: { ...appState.exchanges }
    };

    addHistoryEntry(appState.currentPatientId, entry);
    alert('Kayıt başarıyla eklendi!');
}

// ========================================
// Event Listeners
// ========================================

// Danışan seçimi
elements.patientSelect.addEventListener('change', (e) => {
    loadPatient(e.target.value);
});

// Yeni danışan
elements.btnNewPatient.addEventListener('click', () => {
    elements.patientSelect.value = '';
    loadPatient(null);
});

// Danışan kaydet
elements.btnSavePatient.addEventListener('click', saveCurrentPatient);

// Danışan sil
elements.btnDeletePatient.addEventListener('click', () => {
    if (!appState.currentPatientId) {
        alert('Silinecek danışan yok.');
        return;
    }
    if (confirm('Bu danışanı silmek istediğinize emin misiniz?')) {
        deletePatient(appState.currentPatientId);
        loadPatientList();
        loadPatient(null);
    }
});

// Geçmiş göster
elements.btnViewHistory.addEventListener('click', showHistory);

// Modal kapat
elements.closeHistory.addEventListener('click', () => {
    elements.historyModal.classList.remove('active');
});

elements.historyModal.addEventListener('click', (e) => {
    if (e.target === elements.historyModal) {
        elements.historyModal.classList.remove('active');
    }
});

// Kayıt ekle
elements.btnSaveRecord.addEventListener('click', saveRecord);

// Danışan adı
elements.patientName.addEventListener('input', (e) => {
    appState.patientName = e.target.value;
});

// Danışan arama
if (elements.patientSearch) {
    elements.patientSearch.addEventListener('input', (e) => {
        loadPatientList(e.target.value);
    });
}

// Cinsiyet seçimi
elements.genderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.genderBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.gender = btn.dataset.gender;
        updatePatientCalculations();
    });
});

// Danışan bilgi inputları
elements.heightInput.addEventListener('input', (e) => {
    appState.height = parseFloat(e.target.value) || 0;
    updatePatientCalculations();
});

elements.weightInput.addEventListener('input', (e) => {
    appState.weight = parseFloat(e.target.value) || 0;
    updatePatientCalculations();
});

elements.ageInput.addEventListener('input', (e) => {
    appState.age = parseInt(e.target.value) || 0;
    updatePatientCalculations();
});

// Besin değişim inputları
elements.exchangeInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        const foodType = input.id.replace('-d', '');
        appState.exchanges[foodType] = parseFloat(e.target.value) || 0;
        updateFoodMacros();
    });
});

// Tema butonları
elements.themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setTheme(btn.dataset.themeId);
    });
});


// ========================================
// Başlangıç
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Danışan listesini yükle
    loadPatientList();

    // Input değerlerini state'e senkronize et
    appState.height = parseFloat(elements.heightInput.value) || 170;
    appState.weight = parseFloat(elements.weightInput.value) || 70;
    appState.age = parseInt(elements.ageInput.value) || 30;

    elements.exchangeInputs.forEach(input => {
        const foodType = input.id.replace('-d', '');
        appState.exchanges[foodType] = parseFloat(input.value) || 0;
    });

    // İlk hesaplamaları yap
    updateAllCalculations();

    // Temayı yükle
    initTheme();

    // Service Worker Kaydı
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker kayıtlı!', reg))
                .catch(err => console.log('Service Worker hatası!', err));
        });
    }

    console.log('Sinem Diyet Hesaplama Sistemi v2.0 yüklendi!');
});
