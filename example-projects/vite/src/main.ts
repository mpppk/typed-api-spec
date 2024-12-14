import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>typed-api-spec + Vite</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <div class="card">
      <button id="fetch" type="button">Fetch from GitHub</button>
    </div>
    <p id="result">
      Topics of typed-api-spec will be displayed here after clicking the button.
    </p>
  </div>
`;

const GITHUB_API_ORIGIN = "https://api.github.com";
const GITHUB_REPOSITORY = "nota/typed-api-spec";
const endpoint = `${GITHUB_API_ORIGIN}/repos/${GITHUB_REPOSITORY}/topics`;

const fetchButton = document.querySelector<HTMLButtonElement>("#fetch")!;
const result = document.querySelector<HTMLParagraphElement>("#result")!;
const request = async () => {
  result.innerHTML = "Loading...";
  const response = await fetch(endpoint);
  const { names } = await response.json();
  result.innerHTML = `Result: ${names.join(", ")}`;
};
fetchButton.addEventListener("click", () => request());
