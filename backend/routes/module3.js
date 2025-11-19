import { Router } from "express";
import { getModule3Data, getDepartmentsList, updateAccreditations } from "../database/Module3Controller.js";

const router = Router();

router.get("/departments", (req, res) => {
  try {
    const departamentos = getDepartmentsList();
    res.json(departamentos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener departamentos" });
  }
});

router.get("/data", (req, res) => {
  try {
    const data = getModule3Data();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener datos" });
  }
});

router.post("/save", (req, res) => {
  try {
    const result = updateAccreditations(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar acreditaciones" });
  }
});

export default router;
