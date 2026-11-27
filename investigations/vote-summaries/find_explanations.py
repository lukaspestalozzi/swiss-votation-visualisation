"""Find the Federal Council's explanations (the voting booklet) of every vote day of votes.json.

From 2015-06-14 on, the booklets are on www.admin.ch: a vote day's page links its booklet as a
PDF, under an opaque path. The page is reached by the address of before
(/gov/<lang>/start/dokumentation/abstimmungen/<yyyymmdd>.html), which redirects to it, or by its
new slug (/<lang>/volksabstimmung-vom-<d>-<month>-<yyyy> and the French and Italian forms). For
the vote days before, Swissvotes keeps copies in German and French
(https://swissvotes.ch/vote/<number>.00/brochure-<de|fr>.pdf); Italian pages take the French one
(design of add-vote-summaries, decision 14).

Each document is downloaded into the directory given as the first argument (outside the
repository) and its language is read from the text of its first pages with pdftotext (poppler),
by counting common words. The output is a table, then the "days" object of
pipeline/vote-summaries.json.

Usage: python3 -I investigations/vote-summaries/find_explanations.py <download-dir>
"""

import hashlib
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VOTES = ROOT / "app" / "static" / "data" / "votes.json"
LANGUAGES = ("de", "fr", "it")
FIRST_ON_ADMIN = "2015-06-14"
# admin.ch has no French booklet of 2016-02-28: its French pages link the German one, which Q
# chose to keep (design of add-vote-summaries, decision 14).
OTHER_LANGUAGE = {("2016-02-28", "fr"): "de"}

MONTHS = {
    "de": "januar februar maerz april mai juni juli august september oktober november dezember",
    "fr": "janvier fevrier mars avril mai juin juillet aout septembre octobre novembre decembre",
    "it": "gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre",
}
SLUGS = {
    "de": "volksabstimmung-vom-{d}-{m}-{y}",
    "fr": "votation-populaire-du-{d}-{m}-{y}",
    "it": "votazione-popolare-del-{d}-{m}-{y}",
}
# Common words of each language, to tell a document's language from its text.
WORDS = {
    "de": "der die das und ist nicht mit für von werden",
    "fr": "le la les et est pas avec pour des une",
    "it": "il la gli e è non con per della una",
}
PDF_LINK = re.compile(r'href="(https://www\.admin\.ch/dam/[^"]+\.pdf)"')


def fetch(address: str) -> tuple[int, str, str, bytes]:
    """Status, final address, content type and body of a GET (redirects followed).

    admin.ch answers some requests of a quick series with 403 and the same request a moment later
    with 200, so a 403 is tried again, up to three times, after a pause.
    """
    for attempt in range(4):
        time.sleep(1 if attempt == 0 else 5)
        try:
            with urllib.request.urlopen(address, timeout=120) as answer:
                return answer.status, answer.geturl(), answer.headers.get_content_type(), answer.read()
        except urllib.error.HTTPError as error:
            if error.code != 403 or attempt == 3:
                return error.code, address, "", b""
    raise AssertionError("unreachable")


def admin_pages(day: str, language: str) -> list[str]:
    year, month, date = day.split("-")
    m = MONTHS[language].split()[int(month) - 1]
    pages = [
        f"https://www.admin.ch/gov/{language}/start/dokumentation/abstimmungen/{year}{month}{date}.html"
    ]
    for d in (str(int(date)), date):
        pages.append(f"https://www.admin.ch/{language}/" + SLUGS[language].format(d=d, m=m, y=year))
    return pages


def admin_booklet(day: str, language: str) -> tuple[str, str]:
    """The booklet's address and the page that links it, or ("", the pages tried)."""
    for page in admin_pages(day, language):
        status, final, _, body = fetch(page)
        if status != 200:
            continue
        links = sorted(set(PDF_LINK.findall(body.decode("utf-8", "replace"))))
        if len(links) == 1:
            return links[0], final
        if links:
            return "", f"{final}: {len(links)} PDFs"
    return "", "no page"


def language_of(pdf: Path) -> str:
    text = subprocess.run(
        ["pdftotext", "-f", "1", "-l", "6", str(pdf), "-"],
        capture_output=True,
        check=True,
        text=True,
    ).stdout.lower()
    tokens = re.findall(r"[a-zàâäçéèêëîïôöùûüß]+", text)
    counts = {lang: sum(tokens.count(w) for w in WORDS[lang].split()) for lang in LANGUAGES}
    return max(counts, key=lambda lang: counts[lang])


def main() -> None:
    downloads = Path(sys.argv[1])
    downloads.mkdir(parents=True, exist_ok=True)
    votes = json.loads(VOTES.read_text(encoding="utf-8"))["votes"]
    numbers: dict[str, list[int]] = {}
    for vote in votes:
        numbers.setdefault(vote["date"], []).append(vote["number"])
    days: dict[str, dict[str, dict[str, str]]] = {}
    problems = 0
    for day in sorted(numbers):
        days[day] = {}
        for language in LANGUAGES:
            if day >= FIRST_ON_ADMIN:
                address, found = admin_booklet(day, language)
                wanted = OTHER_LANGUAGE.get((day, language), language)
            else:
                copy = "fr" if language == "it" else language
                address = f"https://swissvotes.ch/vote/{min(numbers[day])}.00/brochure-{copy}.pdf"
                found, wanted = "swissvotes", copy
            if not address:
                print(f"{day} {language} MISSING ({found})")
                problems += 1
                continue
            status, _, kind, body = fetch(address)
            name = hashlib.sha256(address.encode()).hexdigest()[:16] + ".pdf"
            (downloads / name).write_bytes(body)
            read = language_of(downloads / name) if kind == "application/pdf" else "-"
            ok = status == 200 and kind == "application/pdf" and read == wanted
            problems += not ok
            print(
                f"{day} {language} {status} {kind} {len(body):>9} doc={read} "
                f"{'ok' if ok else 'PROBLEM'} {address}"
            )
            days[day][language] = {"address": address, "language": read}
    print(f"\n{sum(len(d) for d in days.values())} addresses, {problems} problems\n")
    print(json.dumps(days, ensure_ascii=False, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
