const express = require("express");
const app = express();
const PORT = 3000;
const fs = require('fs').promises;
const path = require('path');


app.use(express.json()); 



async function readJson(relativePath) {
    try {
      
        const absolutePath = path.resolve(__dirname, relativePath);
        const rawData = await fs.readFile(absolutePath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error(`Error reading or parsing file at ${relativePath}:`, error);
        return []; 
    }
}

app.get("/api/activities", async (req, res) => {
    const actData = await readJson("./data.json"); 
    res.json(actData);
});


// GET    /api/activities/:id

app.get("/api/activities/:id", async (req, res) => {
  
    const id = Number(req.params.id);
    const actData = await readJson("./data.json");
    
    const activity = actData.find(item => item.id === id);

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

       res.json(activity);
});

// POST   /api/activities

app.post("/api/activities", async (req, res) => {
 
    const { activity, location, date, start_time, category } = req.body;

    
    const actData = await readJson("./data.json"); 

  
    const isDuplicate = actData.some(act => act.date === date && act.start_time === start_time);

    
    if (isDuplicate) {
      return res.status(400).json({
        message: `Conflict: Another activity is already scheduled on ${date} at ${start_time}.`
      });
    }

  
    const nextID = actData.length > 0 
      ? Math.max(...actData.map(act => act.id)) + 1 
      : 1;
    
    const newAct = { id: nextID, activity, location, date, start_time, category };

    
    actData.push(newAct);
    await fs.writeFile("./data.json", JSON.stringify(actData, null, 2));

   
    return res.status(201).json({
      message: "Activity added successfully",
      data: newAct
    });

 
});

// DELETE /api/activities/:id

app.delete("/api/activities/:id", async (req, res) => {
  
    
    const id = Number(req.params.id); 
    const actData = await readJson("./data.json");

    
    const activityExists = actData.some(act => act.id === id);
    
    if (!activityExists) {
      return res.status(404).json({ message: "Activity not found" });
    }

    
    const updatedData = actData.filter(act => act.id !== id);

    
    await fs.writeFile("./data.json", JSON.stringify(updatedData, null, 2), "utf-8");

    
    res.status(200).json({ message: "Activity deleted successfully" });
    
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server Running at http://localhost:${PORT}`);
});