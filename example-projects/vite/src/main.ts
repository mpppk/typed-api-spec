import "./style.css";
import fetchGitHub, { GITHUB_API_ORIGIN } from "./github/client.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>typed-api-spec + Vite</h1>
    <div class="card">
      <button id="fetch" type="button">Fetch from GitHub</button>
    </div>
    <p id="result">
      Topics of typed-api-spec will be displayed here after clicking the button.
    </p>
  </div>
`;

const endpoint = `${GITHUB_API_ORIGIN}/repos/nota/typed-api-spec/topics`;

const fetchButton = document.querySelector<HTMLButtonElement>("#fetch")!;
const result = document.querySelector<HTMLParagraphElement>("#result")!;
const request = async () => {
  result.innerHTML = "Loading...";
  const response = await fetchGitHub(endpoint, {});
  if (!response.ok) {
    result.innerHTML = `Error: ${response.status} ${response.statusText}`;
    return;
  }
  const { names } = await response.json();
  result.innerHTML = `Result: ${names.join(", ")}`;
};
fetchButton.addEventListener("click", () => request());
