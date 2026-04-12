# CLAUDE.md

This file provides guidance to Claude Code when working with code in this codebase.

## What is this?

This project is an AI chatbot designed to assist students and faculty at George Mason University

## Guidelines
- No trailing commas
- DRY: Refactor out any redundant code, even if its only one or two lines
- No fancy one-liners
- Short but descriptive variable/parameter/function names; absolutely no one letter names allowed, except for i as an index
- Prefer double quotes; only use single quotes for nested strings
- In general, functions or classes/structs that depend on others should be placed lower in the file, than those do not. The exception is for circular dependencies
- Spaghetti code is a death sentence. Always default to the simplest, most elegant implementation. Make assumptions as necessary, but be sure to mention them.
- Prefer minimal UI components. Don't do any fancy styling unless explicitly asked to