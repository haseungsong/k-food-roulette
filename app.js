const TOTAL_QUESTIONS = 9;
const RADIO_GROUPS = ["age", "gender", "region", "awareness", "frequency", "purchase", "interest"];
const MULTI_STEPS = new Set([5, 6]);

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxtxK-MAvafa0jWXjX90M9ElP0VIc5QviW9XXSvzjFvQH6y6ql9sfJEXOhYHpJSh5HlcQ/exec";

const steps = [[1], [2, 3], [4], [5], [6], [7], [8], [9]];
let stepIndex = 0;
let moving = false;

function startSurvey() {
    document.getElementById("introScreen").classList.add("hidden");
    document.getElementById("surveyScreen").classList.remove("hidden");
    document.getElementById("progressArea").classList.remove("hidden");
    stepIndex = 0;
    showStep();
}

function showStep() {
    const current = new Set(steps[stepIndex]);
    document.querySelectorAll(".question-card").forEach((card) => {
        card.classList.toggle("active", current.has(Number(card.dataset.question)));
    });

    const first = steps[stepIndex][0];
    const last = steps[stepIndex][steps[stepIndex].length - 1];
    const label = first === last
        ? `Pergunta ${first} de 9`
        : `Perguntas ${first}–${last} de 9`;
    const percent = Math.round((stepIndex / steps.length) * 100);

    document.getElementById("progressText").textContent = label;
    document.getElementById("progressPercent").textContent = `${percent}%`;
    document.getElementById("progressFill").style.width = `${percent}%`;
    document.getElementById("backButton").classList.toggle("hidden", stepIndex === 0);
    document.getElementById("nextButton").classList.toggle("hidden", !steps[stepIndex].some((n) => MULTI_STEPS.has(n)));
    document.getElementById("submitButton").classList.toggle("hidden", !current.has(9));
    window.scrollTo(0, 0);
}

function stepAnswered() {
    return steps[stepIndex].every((number) => {
        return document.querySelector(`[data-question="${number}"] input:checked`);
    });
}

function goNext() {
    if (moving || stepIndex >= steps.length - 1) return;
    if (!stepAnswered()) {
        showError("Escolha uma opção para continuar.");
        return;
    }
    moving = true;
    stepIndex += 1;
    showStep();
    setTimeout(() => { moving = false; }, 280);
}

document.getElementById("backButton").addEventListener("click", () => {
    if (stepIndex === 0) return;
    stepIndex -= 1;
    showStep();
});

document.getElementById("nextButton").addEventListener("click", goNext);

document.addEventListener("change", function (event) {
    const input = event.target;
    if (input.name === "foods") {
        const boxes = [...document.querySelectorAll('input[name="foods"]')];
        if (input.value === "Nenhuma" && input.checked) {
            boxes.forEach((box) => { if (box !== input) box.checked = false; });
        } else if (input.checked) {
            boxes.forEach((box) => { if (box.value === "Nenhuma") box.checked = false; });
        }
        return;
    }

    if (!input.matches('input[type="radio"]')) return;
    if (steps[stepIndex].includes(9)) return;
    if (steps[stepIndex].some((n) => MULTI_STEPS.has(n))) return;
    if (stepAnswered()) setTimeout(goNext, 180);
});

function validateSurvey() {
    for (const group of RADIO_GROUPS) {
        const selected = document.querySelector(`input[name="${group}"]:checked`);
        if (!selected) {
            showError("Por favor, responda todas as perguntas antes de enviar.");
            document.querySelector(`input[name="${group}"]`)
                ?.closest(".question-card")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            return false;
        }
    }

    const foods = document.querySelectorAll('input[name="foods"]:checked');
    if (foods.length === 0) {
        showError("Por favor, selecione pelo menos uma opção na pergunta 5.");
        stepIndex = steps.findIndex((step) => step.includes(5));
        showStep();
        return false;
    }

    const favorites = document.querySelectorAll('input[name="favorite"]:checked');
    if (favorites.length === 0) {
        showError("Por favor, selecione pelo menos uma opção na pergunta 6.");
        stepIndex = steps.findIndex((step) => step.includes(6));
        showStep();
        return false;
    }

    return true;
}

function collectSurveyData() {
    const getRadio = (name) => {
        const element = document.querySelector(`input[name="${name}"]:checked`);
        return element ? element.value : "";
    };

    const foods = Array.from(document.querySelectorAll('input[name="foods"]:checked'))
        .map((element) => element.value);

    return {
        timestamp: new Date().toISOString(),
        age: getRadio("age"),
        gender: getRadio("gender"),
        region: getRadio("region"),
        awareness: getRadio("awareness"),
        foods: foods.join(", "),
        favorite: Array.from(document.querySelectorAll('input[name="favorite"]:checked')).map((element) => element.value).join(", "),
        frequency: getRadio("frequency"),
        purchase: getRadio("purchase"),
        interest: Number(getRadio("interest"))
    };
}

async function submitSurvey() {
    if (!validateSurvey()) return;

    const button = document.getElementById("submitButton");
    button.disabled = true;
    button.textContent = "Enviando...";

    const data = collectSurveyData();

    try {
        if (GOOGLE_SCRIPT_URL.includes("COLOQUE_AQUI")) {
            saveLocal(data);
        } else {
            await postToSheet(data);
            saveLocal(data);
        }
        showSuccess();
    } catch (error) {
        console.error(error);
        saveLocal(data);
        showSuccess();
    }
}

function postToSheet(data) {
    return new Promise((resolve) => {
        const iframe = document.createElement("iframe");
        iframe.name = "kfood-sheet";
        iframe.hidden = true;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = GOOGLE_SCRIPT_URL;
        form.target = iframe.name;
        Object.entries(data).forEach(([key, value]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
        });
        document.body.appendChild(iframe);
        document.body.appendChild(form);
        form.submit();
        setTimeout(() => {
            form.remove();
            iframe.remove();
            resolve();
        }, 2500);
    });
}

function saveLocal(data) {
    const existing = JSON.parse(localStorage.getItem("kfoodSurveyData") || "[]");
    existing.push(data);
    localStorage.setItem("kfoodSurveyData", JSON.stringify(existing));
}

function showSuccess() {
    document.getElementById("surveyScreen").classList.add("hidden");
    document.getElementById("successScreen").classList.remove("hidden");
    document.getElementById("progressArea").classList.remove("hidden");
    document.getElementById("progressFill").style.width = "100%";
    document.getElementById("progressText").textContent = "Pesquisa concluída";
    document.getElementById("progressPercent").textContent = "100%";
}

function goToRoulette() {
    sessionStorage.setItem("kfoodSurveyDone", "1");
    window.location.href = "roulette.html";
}

function showError(message) {
    const error = document.getElementById("errorMessage");
    error.textContent = message;
    error.classList.remove("hidden");
    setTimeout(() => error.classList.add("hidden"), 3500);
}
