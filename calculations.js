/**
 * Sinem Diyet Hesaplama Sistemi
 * Hesaplama Fonksiyonları
 * Excel formüllerinin JavaScript implementasyonu
 */

// ========================================
// Besin Değişim Sabitleri
// Değeri olmayanlar null olarak bırakıldı
// ========================================
const FOOD_EXCHANGE_VALUES = {
    milk: {
        name: 'Süt / Yoğurt',
        carb: 9,      // D × 9
        protein: 6,   // D × 6
        fat: 6        // D × 6
    },
    eyp: {
        name: 'EYP (Ekmek Grubu)',
        carb: null,   // Excel'de yok
        protein: 6,   // D × 6
        fat: 5        // D × 5
    },
    etk: {
        name: 'ETK (Et Grubu)',
        carb: 15,     // D × 15
        protein: 2,   // D × 2
        fat: null     // Excel'de yok
    },
    vegetable: {
        name: 'Sebze',
        carb: 6,      // D × 6
        protein: 2,   // D × 2
        fat: null     // Excel'de yok
    },
    fruit: {
        name: 'Meyve',
        carb: 15,     // D × 15
        protein: null,// Excel'de yok
        fat: null     // Excel'de yok
    },
    fat: {
        name: 'Yağ',
        carb: null,   // Excel'de yok
        protein: null,// Excel'de yok
        fat: 5        // D × 5
    },
    yt: {
        name: 'YT / SKY',
        carb: null,   // Excel'de yok
        protein: 2,   // D × 2
        fat: 5        // D × 5
    },
    serbest: {
        name: 'Serbest',
        carb: null,   // Excel'de belirsiz
        protein: null,
        fat: null
    }
};

// Kalori sabitleri
const CALORIES_PER_GRAM = {
    carb: 4,
    protein: 4,
    fat: 9
};

// Aktivite düzeyi çarpanları ve açıklamaları
const ACTIVITY_LEVELS = [
    { multiplier: 1.1, name: 'Hareketsiz', description: 'Masa başı iş, egzersiz yok' },
    { multiplier: 1.2, name: 'Hafif Aktif', description: 'Haftada 1-3 gün hafif egzersiz' },
    { multiplier: 1.3, name: 'Orta Aktif', description: 'Haftada 3-5 gün orta egzersiz' },
    { multiplier: 1.4, name: 'Çok Aktif', description: 'Haftada 6-7 gün yoğun egzersiz' },
    { multiplier: 1.5, name: 'Ekstra Aktif', description: 'Günde 2 kez antrenman / ağır fiziksel iş' }
];

// Yaşa göre hedef BKİ değerleri
const BMI_BY_AGE = [
    { minAge: 0, maxAge: 24, bmi: 21 },
    { minAge: 25, maxAge: 34, bmi: 22 },
    { minAge: 35, maxAge: 44, bmi: 23 },
    { minAge: 45, maxAge: 54, bmi: 24 },
    { minAge: 55, maxAge: 64, bmi: 25 },
    { minAge: 65, maxAge: 999, bmi: 26 }
];

// BKİ kategorileri
const BMI_CATEGORIES = [
    { max: 18.5, status: 'Zayıf', class: 'underweight' },
    { max: 24.9, status: 'Normal', class: 'normal' },
    { max: 29.9, status: 'Kilolu', class: 'overweight' },
    { max: 999, status: 'Obez', class: 'obese' }
];

// ========================================
// BKİ (Vücut Kitle İndeksi) Hesaplama
// ========================================
function calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
}

function getBMICategory(bmi) {
    for (const category of BMI_CATEGORIES) {
        if (bmi <= category.max) {
            return category;
        }
    }
    return BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}

// ========================================
// İdeal Kilo Hesaplama (Yaşa Göre)
// ========================================
function getTargetBMI(age) {
    for (const range of BMI_BY_AGE) {
        if (age >= range.minAge && age <= range.maxAge) {
            return range.bmi;
        }
    }
    return 24;
}

function calculateIdealWeight(height, age) {
    const targetBMI = getTargetBMI(age);
    const heightInMeters = height / 100;
    return targetBMI * (heightInMeters * heightInMeters);
}

// ========================================
// BMR (Bazal Metabolizma Hızı) Hesaplama
// ========================================

/**
 * Harris-Benedict Denklemi (1919, revize 1984)
 * Daha eski ve yaygın kullanılan formül
 * Erkek: BMR = 66.5 + (13.7 × Kilo) + (5 × Boy) - (6.7 × Yaş)
 * Kadın: BMR = 655 + (9.6 × Kilo) + (1.8 × Boy) - (4.7 × Yaş)
 */
function calculateBMR_HarrisBenedict(weight, height, age, gender) {
    if (gender === 'male') {
        return 66.5 + (13.7 * weight) + (5 * height) - (6.7 * age);
    }
    return 655 + (9.6 * weight) + (1.8 * height) - (4.7 * age);
}

/**
 * Mifflin-St Jeor Denklemi (1990)
 * Daha güncel ve genellikle daha doğru kabul edilir
 * Erkek: BMR = (10 × Kilo) + (6.25 × Boy) - (5 × Yaş) + 5
 * Kadın: BMR = (10 × Kilo) + (6.25 × Boy) - (5 × Yaş) - 161
 */
function calculateBMR_MifflinStJeor(weight, height, age, gender) {
    const base = (10 * weight) + (6.25 * height) - (5 * age);
    return gender === 'male' ? base + 5 : base - 161;
}

/**
 * TDEE (Total Daily Energy Expenditure) Hesaplama
 * Günlük toplam enerji harcaması
 */
function calculateTDEE(bmr, activityMultiplier) {
    return bmr * activityMultiplier;
}

/**
 * Tüm aktivite düzeyleri için TDEE hesapla
 */
function calculateAllTDEE(bmr) {
    return ACTIVITY_LEVELS.map(level => ({
        ...level,
        tdee: Math.round(bmr * level.multiplier)
    }));
}

// ========================================
// Besin Değişim Hesaplamaları
// ========================================
function calculateFoodMacros(foodType, exchangeCount) {
    const food = FOOD_EXCHANGE_VALUES[foodType];
    if (!food) return { carb: null, protein: null, fat: null };

    return {
        carb: food.carb !== null ? food.carb * exchangeCount : null,
        protein: food.protein !== null ? food.protein * exchangeCount : null,
        fat: food.fat !== null ? food.fat * exchangeCount : null
    };
}

function calculateTotalMacros(exchanges) {
    let totalCarb = 0;
    let totalProtein = 0;
    let totalFat = 0;

    for (const [foodType, count] of Object.entries(exchanges)) {
        const macros = calculateFoodMacros(foodType, count);
        if (macros.carb !== null) totalCarb += macros.carb;
        if (macros.protein !== null) totalProtein += macros.protein;
        if (macros.fat !== null) totalFat += macros.fat;
    }

    return {
        carb: totalCarb,
        protein: totalProtein,
        fat: totalFat
    };
}

// ========================================
// Kalori Hesaplamaları
// ========================================
function calculateCalories(macros) {
    const carbCalories = macros.carb * CALORIES_PER_GRAM.carb;
    const proteinCalories = macros.protein * CALORIES_PER_GRAM.protein;
    const fatCalories = macros.fat * CALORIES_PER_GRAM.fat;
    const totalCalories = carbCalories + proteinCalories + fatCalories;

    return {
        carb: carbCalories,
        protein: proteinCalories,
        fat: fatCalories,
        total: totalCalories
    };
}

function calculateMacroPercentages(calories) {
    if (calories.total === 0) {
        return { carb: 0, protein: 0, fat: 0 };
    }

    return {
        carb: (calories.carb / calories.total) * 100,
        protein: (calories.protein / calories.total) * 100,
        fat: (calories.fat / calories.total) * 100
    };
}

// ========================================
// Hedef Makro Aralıkları
// ========================================
function calculateTargetMacroGrams(totalCalories) {
    return {
        carb: {
            min: Math.round((totalCalories * 0.45) / CALORIES_PER_GRAM.carb),
            max: Math.round((totalCalories * 0.60) / CALORIES_PER_GRAM.carb)
        },
        protein: {
            min: Math.round((totalCalories * 0.15) / CALORIES_PER_GRAM.protein),
            max: Math.round((totalCalories * 0.20) / CALORIES_PER_GRAM.protein)
        },
        fat: {
            min: Math.round((totalCalories * 0.25) / CALORIES_PER_GRAM.fat),
            max: Math.round((totalCalories * 0.35) / CALORIES_PER_GRAM.fat)
        }
    };
}

// ========================================
// Danışan Yönetimi (LocalStorage)
// ========================================
const STORAGE_KEY = 'sinem_diet_patients';

function getPatients() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function savePatients(patients) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

function addPatient(patient) {
    const patients = getPatients();
    patient.id = Date.now().toString();
    patient.createdAt = new Date().toISOString();
    patient.history = [];
    patients.push(patient);
    savePatients(patients);
    return patient;
}

function updatePatient(id, updates) {
    const patients = getPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index !== -1) {
        patients[index] = { ...patients[index], ...updates };
        savePatients(patients);
        return patients[index];
    }
    return null;
}

function deletePatient(id) {
    const patients = getPatients();
    const filtered = patients.filter(p => p.id !== id);
    savePatients(filtered);
}

function getPatientById(id) {
    const patients = getPatients();
    return patients.find(p => p.id === id);
}

function addHistoryEntry(patientId, entry) {
    const patients = getPatients();
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        if (!patient.history) patient.history = [];
        entry.date = new Date().toISOString();
        entry.id = Date.now().toString();
        patient.history.push(entry);
        savePatients(patients);
        return entry;
    }
    return null;
}

// ========================================
// Export
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FOOD_EXCHANGE_VALUES,
        CALORIES_PER_GRAM,
        ACTIVITY_LEVELS,
        BMI_BY_AGE,
        BMI_CATEGORIES,
        calculateBMI,
        getBMICategory,
        getTargetBMI,
        calculateIdealWeight,
        calculateBMR_HarrisBenedict,
        calculateBMR_MifflinStJeor,
        calculateTDEE,
        calculateAllTDEE,
        calculateFoodMacros,
        calculateTotalMacros,
        calculateCalories,
        calculateMacroPercentages,
        calculateTargetMacroGrams,
        getPatients,
        savePatients,
        addPatient,
        updatePatient,
        deletePatient,
        getPatientById,
        addHistoryEntry
    };
}
