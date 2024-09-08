# Obsidian Tokenz

<!-- markdownlint-disable -->

Use any kind of short codes in Obsidian with using code maps:

- **Built-in** maps can be used immedately:  
  - **emojis** (``:smile:`` 🙂, ``:wink:`` 😉, ...),  
  and the classic, good old  
  - **smileys** ( **``:-)``** 🙂, **``8-D``** 😎, ...).  
- **User defined** maps can be in any format you'd like, for example:  
  ▎🏆 Tokenz beginning with "!": ``!success``  
  ▋💡CSS class style short code: ``.idea``  
  ▉ 📺  Or any format you can imagine, e.g: ``|tv_episode|``  
For further explanation and a short configuration guide see [2](#2-user-defined-code-maps) .  

For a demo of the features see this video:<br>
<img align="center" src="https://github.com/user-attachments/assets/6e20d9ea-bb23-4082-ba0b-686987a4d989">
<br><br><br>


## Configuration
There are several configuration options. They are mostly straightforward and will be documented later.
### 1. Installation
It's standard, from source:  
1. Get the sources: ``git clone https://github.com/ferenk/obsidian-tokenz``  
2. Init the sources folder: ``cd obsidian-tokenz; npm install``  
3. Built the plugin: ``npm run build``  
4. Create a folder in your Obsidian wallet: ``mkdir <your wallet's path>/.obsidian/plugins/tokenz``  
5. Copy the plugin's files **main.js**, **manifest.json**, **styles.css** into the folder just created  
6. Restart Obsidian and enable the "Tokenz" plugin  
7. Start typing ``:)``

### 2. User defined code maps
It's easy to define your own code maps. You can choose anyformat for your short codes (tokens). But you can also mix different formats.  
1. Choose a name for your code map, e.g **my code map**  
2. Create a folder named **data** in <Your wallet's path>/.obsidian/plugins/tokenz
3. Create an index file of the code maps in the data folder just created. It's name must be **maps.lst**.  
   Example ***data/maps.lst:***
   ```
   my_code_map.json
   ```
5. Create your own code map file. It's structure is very simple, for example here are are the codes for our sample paragraph<br>(it demonstrates the easy usage of mixed formats)  
   Example ***my_code_map.json:***
   ```
   {
       "/progress-20":     "▎",
       "/progress-50":     "▋",
       "/progress-80":     "▉",
       "/progress-90-exp": "█ 90%",
       "!success":	         "🏆",
       ".idea":	         "💡",
       "|tv_episode|":	 "📺"
   }
   ```
   And now you can insert this to your document:
   ```
   /progress-20 !success  Tokenz beginning with "!"
   /progress-50 .idea  CSS class style short code
   /progress-80  |tv_episode|   Or any format you can imagine
   ```
