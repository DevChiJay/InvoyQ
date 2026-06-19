from typing import Any, Dict, Optional
import os
import base64
import httpx

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

PROMPT_SYSTEM = (
    "You extract structured invoice/job details from chat text or images. "
    "Return only JSON with keys: jobs (list of strings), deadlines (list of ISO dates or strings), "
    "payment_terms (string|null), amount (number|null), currency (string|null), "
    "client_name (string|null), client_email (string|null), client_address (string|null), "
    "sender_name (string|null — the business or person issuing the invoice), "
    "sender_email (string|null — the email of the invoice sender), "
    "sender_address (string|null — the address of the invoice sender), "
    "status (one of: draft, sent, paid, overdue, cancelled — infer from context; null if not clear), "
    "confidence (0-100)."
)

PROMPT_USER_TEMPLATE = (
    "Given the following chat text, extract the requested fields. If not found, use nulls or empty arrays.\n\n" 
    "Chat text:\n\n{content}"
)


class OpenAIExtractor:
    def __init__(self, api_key: Optional[str] = None, model:  Optional[str] = None) -> None:
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY not configured")
        self.model = model or os.getenv("EXTRACTOR_MODEL")

    async def _call_openai_text(self, text: str) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": PROMPT_SYSTEM},
                {"role": "user", "content": PROMPT_USER_TEMPLATE.format(content=text)},
            ],
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(OPENAI_API_URL, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            # Ensure content is a JSON string
            import json
            try:
                return json.loads(content)
            except Exception:
                # Fallback minimal shape
                return {
                    "jobs": [text[:200]] if text else [],
                    "deadlines": [],
                    "payment_terms": None,
                    "amount": None,
                    "currency": None,
                    "client_name": None,
                    "client_email": None,
                    "client_address": None,
                    "sender_name": None,
                    "sender_email": None,
                    "sender_address": None,
                    "status": None,
                    "confidence": 50,
                }

    def extract_from_text(self, text: str) -> Dict[str, Any]:
        # Provide a sync wrapper for FastAPI sync endpoints/tests
        import anyio
        return anyio.run(self._call_openai_text, text)

    async def _call_openai_vision(
        self,
        text: Optional[str],
        image_bytes: Optional[bytes],
        image_mime: Optional[str] = None,
    ) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        user_content = []
        if text:
            user_content.append({"type": "text", "text": PROMPT_USER_TEMPLATE.format(content=text)})
        if image_bytes:
            b64 = base64.b64encode(image_bytes).decode("ascii")
            mime = image_mime or "image/png"
            user_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{mime};base64,{b64}"},
            })

        payload = {
            "model": self.model,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": PROMPT_SYSTEM},
                {"role": "user", "content": user_content or [{"type": "text", "text": PROMPT_USER_TEMPLATE.format(content="")} ]},
            ],
        }

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(OPENAI_API_URL, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            import json
            try:
                return json.loads(content)
            except Exception:
                # Fallback minimal shape
                return {
                    "jobs": [text[:200]] if text else [],
                    "deadlines": [],
                    "payment_terms": None,
                    "amount": None,
                    "currency": None,
                    "client_name": None,
                    "client_email": None,
                    "client_address": None,
                    "sender_name": None,
                    "sender_email": None,
                    "sender_address": None,
                    "status": None,
                    "confidence": 50,
                }

    def extract(self, text: Optional[str], image_bytes: Optional[bytes], image_mime: Optional[str] = None) -> Dict[str, Any]:
        """Unified extractor for text + image using GPT-Vision.

        If image is provided, performs one multimodal request that handles OCR and extraction.
        Falls back to text-only if image is None.
        """
        import anyio
        if image_bytes:
            return anyio.run(self._call_openai_vision, text, image_bytes, image_mime)
        return anyio.run(self._call_openai_text, text or "")
