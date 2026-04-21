const display = document.querySelector("#display");
const buttons = document.querySelectorAll(".btn");

const state = {
  currentInput: "0",
  previousOperator: null,
  previousOperand: null,
  waitingForNextOperand: false,
  error: false,
};

function updateDisplay() {
  display.textContent = state.currentInput;
}

function resetState() {
  state.currentInput = "0";
  state.previousOperator = null;
  state.previousOperand = null;
  state.waitingForNextOperand = false;
  state.error = false;
}

function setError(message = "Error") {
  state.currentInput = message;
  state.previousOperator = null;
  state.previousOperand = null;
  state.waitingForNextOperand = false;
  state.error = true;
}

function performCalculation(a, operator, b) {
  if (operator === "/" && b === 0) {
    return "DIV_BY_ZERO";
  }

  // NOTE: eval() is acceptable for simple demos, but production apps should use
  // a proper expression parser to avoid security vulnerabilities.
  return eval(`${a} ${operator} ${b}`);
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(10)));
}

function inputNumber(value) {
  if (state.error) resetState();

  if (value === ".") {
    if (state.waitingForNextOperand) {
      state.currentInput = "0.";
      state.waitingForNextOperand = false;
      return;
    }

    // Prevent multiple decimal points in one number.
    if (state.currentInput.includes(".")) return;

    // Prepend leading decimal with 0.
    state.currentInput = state.currentInput === "0" ? "0." : `${state.currentInput}.`;
    return;
  }

  if (state.waitingForNextOperand) {
    state.currentInput = value;
    state.waitingForNextOperand = false;
    return;
  }

  state.currentInput = state.currentInput === "0" ? value : `${state.currentInput}${value}`;
}

function inputOperator(operator) {
  if (state.error) return;

  const inputValue = Number(state.currentInput);

  // Consecutive operator presses replace previous operator.
  if (state.waitingForNextOperand) {
    state.previousOperator = operator;
    return;
  }

  if (state.previousOperator !== null && state.previousOperand !== null) {
    const result = performCalculation(state.previousOperand, state.previousOperator, inputValue);
    if (result === "DIV_BY_ZERO") {
      setError("Cannot divide by zero");
      return;
    }
    state.previousOperand = result;
    state.currentInput = formatNumber(result);
  } else {
    state.previousOperand = inputValue;
  }

  state.previousOperator = operator;
  state.waitingForNextOperand = true;
}

function evaluateResult() {
  if (state.error) return;
  if (state.previousOperator === null || state.previousOperand === null || state.waitingForNextOperand) return;

  const inputValue = Number(state.currentInput);
  const result = performCalculation(state.previousOperand, state.previousOperator, inputValue);

  if (result === "DIV_BY_ZERO") {
    setError("Cannot divide by zero");
    return;
  }

  state.currentInput = formatNumber(result);
  state.previousOperator = null;
  state.previousOperand = null;
  state.waitingForNextOperand = false;
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.type;
    const value = button.dataset.value;

    if (type === "number") inputNumber(value);
    if (type === "operator") inputOperator(value);
    if (type === "equals") evaluateResult();
    if (type === "clear") resetState();

    updateDisplay();
  });
});

updateDisplay();
