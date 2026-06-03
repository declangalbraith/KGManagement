"""Document version label: 0.1, 0.9-0.1, major bump on approve -> 1.0."""

from __future__ import annotations


def parse_version_label(label: str) -> list[tuple[int, int]]:
    if not label or not label.strip():
        raise ValueError("version label is empty")
    segments: list[tuple[int, int]] = []
    for part in label.strip().split("-"):
        if "." not in part:
            raise ValueError(f"invalid version segment: {part}")
        major_str, minor_str = part.split(".", 1)
        segments.append((int(major_str), int(minor_str)))
    return segments


def format_version_label(segments: list[tuple[int, int]]) -> str:
    if not segments:
        raise ValueError("segments empty")
    parts = [f"{major}.{minor}" for major, minor in segments]
    return parts[0] if len(parts) == 1 else "-".join(parts)


def display_version(label: str) -> str:
    return f"V{label}"


def bump_revision(label: str) -> str:
    segments = parse_version_label(label)
    major, minor = segments[-1]
    if minor < 9:
        segments[-1] = (major, minor + 1)
    else:
        segments.append((0, 1))
    return format_version_label(segments)


def bump_major_on_approve(label: str) -> str:
    segments = parse_version_label(label)
    major = segments[0][0]
    return f"{major + 1}.0"


def initial_version_label() -> str:
    return "0.1"
