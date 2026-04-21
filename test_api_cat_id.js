async function test() {
    const url = "https://backend.jerseyperfume.com/wp-json/wc/store/v1/products?page=1&per_page=4&category=6310";
    const resp = await fetch(url);
    console.log("Status:", resp.status);
    console.log("Status Text:", resp.statusText);
    const data = await resp.json();
    console.log("Body length:", data.length);
}
test();
