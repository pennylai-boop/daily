/**
 * 把訂單送去 PAYUNi 的付款頁。
 *
 * UPP 規定由瀏覽器 form post 過去（不是 fetch），所以這裡動態組一張隱藏表單再 submit，
 * 送出後就會離開本頁。贊助與購買點數都用同一支。
 */
export function postToGateway(action: string, fields: Record<string, string>): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";

  for (const [name, value] of Object.entries(fields)) {
    const field = document.createElement("input");
    field.type = "hidden";
    field.name = name;
    field.value = value;
    form.appendChild(field);
  }

  document.body.appendChild(form);
  form.submit();
}
