import nest_asyncio
nest_asyncio.apply()

import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pytz import timezone
import json
import shlex  # For parsing quoted strings properly

default_timezone = timezone("UTC")
DATA_FILE = "anime-data.json"

def load_data():
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

WELCOME_TEXT = """
👋 Welcome to the Anime Bot!

Commands:
/start - Show this message
/help - Show this message
/add_anime "<name>" <category> <image_url> "<description>" <download_link> - Add a new anime

Example:
/add_anime "Attack on Titan" anime https://example.com/aot.jpg "A story about humanity vs Titans" https://example.com/download-aot
"""

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(WELCOME_TEXT)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(WELCOME_TEXT)

async def add_anime(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        # Parse arguments with spaces properly using shlex
        args = shlex.split(update.message.text.split(' ', 1)[1])
    except (ValueError, IndexError):
        await update.message.reply_text(
            "❌ Invalid format. Use: /add_anime \"<name>\" <category> <image_url> \"<description>\" <download_link>\n"
            "Example: /add_anime \"Attack on Titan\" anime https://example.com/aot.jpg \"A story about humanity vs Titans\" https://example.com/download-aot"
        )
        return

    if len(args) < 5:
        await update.message.reply_text(
            "❌ Usage: /add_anime \"<name>\" <category> <image_url> \"<description>\" <download_link>\n"
            "Example: /add_anime \"Attack on Titan\" anime https://example.com/aot.jpg \"A story about humanity vs Titans\" https://example.com/download-aot"
        )
        return

    name = args[0]
    category = args[1].lower()
    image_url = args[2]
    description = args[3]
    download_link = args[4]

    new_anime = {
        "name": name,
        "category": category,
        "image": image_url,
        "description": description,
        "download": download_link
    }

    data = load_data()
    data.append(new_anime)
    save_data(data)
    await update.message.reply_text(f"✅ Anime '{name}' added successfully under category '{category}' with image!")

async def main():
    application = Application.builder().token("8006836827:AAF7YXTukf_5tU4mnNKzKxIBbQnq08yxrHM").build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("add_anime", add_anime))

    scheduler = AsyncIOScheduler(timezone=default_timezone)
    scheduler.start()

    print("Bot is running... 🚀")

    await application.run_polling()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
