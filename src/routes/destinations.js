import express from "express";
import {
  getAllDestinations,
  getDestinationById,
} from "../data/destinations.js";

const router = express.Router();

/**
 * GET /api/destinations
 * Get all tourism destinations
 * Returns status 200 with array of all destinations
 */
router.get("/", (req, res, next) => {
  try {
    const destinations = getAllDestinations();
    res.status(200).json(destinations);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/destinations/:id
 * Get single destination by ID
 * Returns status 200 for valid IDs, 404 for invalid IDs
 */
router.get("/:id", (req, res, next) => {
  try {
    const { id } = req.params;
    const destination = getDestinationById(id);

    if (!destination) {
      return res.status(404).json({
        error: "Not Found",
        message: `Destination with id '${id}' not found`,
      });
    }

    res.status(200).json(destination);
  } catch (error) {
    next(error);
  }
});

export default router;
