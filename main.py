from telegram import Update
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext
import json

# Load existing anime data
DATA_FILE = "anime-data.json"

def load_data():
    try:
        with open(DATA_FILE, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        return []

def save_data(data):
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)

def start(update: Update, context: CallbackContext):
    update.message.reply_text("Welcome! Use /add_anime to add a new anime.")

def add_anime(update: Update, context: CallbackContext):
    args = context.args
    if len(args) < 3:
        update.message.reply_text("Usage: /add_anime <name> <description> <download_link>")
        return
    
    name = args[0]
    description = " ".join(args[1:-1])
    download_link = args[-1]

    new_anime = {
        "name": name,
        "description": description,
        "download": download_link,
        "category": "ongoing",
        "image": "images/placeholder.jpg"
    }

    data = load_data()
    data.append(new_anime)
    save_data(data)
    update.message.reply_text(f"Anime '{name}' added successfully!")

def main():
    updater = Updater("8006836827:AAF7YXTukf_5tU4mnNKzKxIBbQnq08yxrHM", use_context=True)
    dispatcher = updater.dispatcher

    dispatcher.add_handler(CommandHandler("start", start))
    dispatcher.add_handler(CommandHandler("add_anime", add_anime))

    updater.start_polling()
    updater.idle()

if __name__ == "__main__":
    main()
