import Medicine from '../models/Medicine.js';
import { notifyRoles } from '../services/notificationService.js';

// GET /api/pharmacy/medicines - List active medicines with filtering & search
export const getMedicines = async (req, res) => {
  try {
    const { search, category, lowStock, expiringSoon } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { genericName: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    if (expiringSoon === 'true') {
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(now.getDate() + 30);
      filter.expiryDate = { $lte: in30Days, $gte: now };
    }

    const medicines = await Medicine.find(filter).sort({ name: 1 });

    const now = new Date();
    const formattedMedicines = medicines.map((m) => {
      let status = 'IN STOCK';
      if (m.expiryDate && new Date(m.expiryDate) <= now) {
        status = 'EXPIRED';
      } else if (m.quantity === 0) {
        status = 'OUT OF STOCK';
      } else if (m.quantity <= m.reorderLevel) {
        status = 'LOW STOCK';
      }

      return {
        ...m.toObject(),
        status,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedMedicines.length,
      data: formattedMedicines,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medicines',
      error: error.message,
    });
  }
};

// GET /api/pharmacy/medicines/:id - Get single medicine details
export const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    const now = new Date();
    let status = 'IN STOCK';
    if (medicine.expiryDate && new Date(medicine.expiryDate) <= now) {
      status = 'EXPIRED';
    } else if (medicine.quantity === 0) {
      status = 'OUT OF STOCK';
    } else if (medicine.quantity <= medicine.reorderLevel) {
      status = 'LOW STOCK';
    }

    return res.status(200).json({
      success: true,
      data: {
        ...medicine.toObject(),
        status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch medicine details',
      error: error.message,
    });
  }
};

// POST /api/pharmacy/medicines - Register formulation (Admin / Pharmacist)
export const createMedicine = async (req, res) => {
  try {
    const {
      name,
      genericName,
      category,
      manufacturer,
      strength,
      dosageForm,
      batchNumber,
      expiryDate,
      quantity,
      reorderLevel,
      unitPrice,
      description,
    } = req.body;

    if (!name || !genericName || !category || !batchNumber || !expiryDate || unitPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required medicine fields (name, genericName, category, batchNumber, expiryDate, unitPrice)',
      });
    }

    const newMedicine = new Medicine({
      name: name.trim(),
      genericName: genericName.trim(),
      category: category.trim(),
      manufacturer: manufacturer ? manufacturer.trim() : '',
      strength: strength ? strength.trim() : '',
      dosageForm: dosageForm ? dosageForm.trim() : 'Tablet',
      batchNumber: batchNumber.trim(),
      expiryDate: new Date(expiryDate),
      quantity: Math.max(0, parseInt(quantity) || 0),
      reorderLevel: Math.max(0, parseInt(reorderLevel) || 10),
      unitPrice: Math.max(0, parseFloat(unitPrice) || 0),
      description: description ? description.trim() : '',
      isActive: true,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await newMedicine.save();

    return res.status(201).json({
      success: true,
      message: `Medicine '${newMedicine.name}' registered successfully`,
      data: newMedicine,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create medicine',
      error: error.message,
    });
  }
};

// PUT /api/pharmacy/medicines/:id - Update formulation (Admin / Pharmacist)
export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      genericName,
      category,
      manufacturer,
      strength,
      dosageForm,
      batchNumber,
      expiryDate,
      quantity,
      reorderLevel,
      unitPrice,
      description,
      isActive,
    } = req.body;

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    if (name) medicine.name = name.trim();
    if (genericName) medicine.genericName = genericName.trim();
    if (category) medicine.category = category.trim();
    if (manufacturer !== undefined) medicine.manufacturer = manufacturer.trim();
    if (strength !== undefined) medicine.strength = strength.trim();
    if (dosageForm !== undefined) medicine.dosageForm = dosageForm.trim();
    if (batchNumber) medicine.batchNumber = batchNumber.trim();
    if (expiryDate) medicine.expiryDate = new Date(expiryDate);
    if (quantity !== undefined) medicine.quantity = Math.max(0, parseInt(quantity));
    if (reorderLevel !== undefined) medicine.reorderLevel = Math.max(0, parseInt(reorderLevel));
    if (unitPrice !== undefined) medicine.unitPrice = Math.max(0, parseFloat(unitPrice));
    if (description !== undefined) medicine.description = description.trim();
    if (isActive !== undefined) medicine.isActive = Boolean(isActive);

    medicine.updatedBy = req.user._id;
    await medicine.save();

    return res.status(200).json({
      success: true,
      message: `Medicine '${medicine.name}' updated successfully`,
      data: medicine,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update medicine',
      error: error.message,
    });
  }
};

// PATCH /api/pharmacy/medicines/:id/deactivate - Soft deactivate formulation
export const deactivateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    medicine.isActive = false;
    medicine.updatedBy = req.user._id;
    await medicine.save();

    return res.status(200).json({
      success: true,
      message: `Medicine '${medicine.name}' deactivated successfully`,
      data: medicine,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate medicine',
      error: error.message,
    });
  }
};

// PATCH /api/pharmacy/medicines/:id/stock - Atomic stock adjustment
export const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { change } = req.body;

    const delta = parseInt(change);
    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid non-zero integer stock change is required',
      });
    }

    let updatedMedicine;

    if (delta > 0) {
      // Increase stock atomically
      updatedMedicine = await Medicine.findOneAndUpdate(
        { _id: id, isActive: true },
        {
          $inc: { quantity: delta },
          $set: { updatedBy: req.user._id },
        },
        { new: true }
      );
    } else {
      // Decrease stock atomically only if sufficient quantity exists
      const decAmount = Math.abs(delta);
      updatedMedicine = await Medicine.findOneAndUpdate(
        { _id: id, isActive: true, quantity: { $gte: decAmount } },
        {
          $inc: { quantity: -decAmount },
          $set: { updatedBy: req.user._id },
        },
        { new: true }
      );
    }

    if (!updatedMedicine) {
      const exists = await Medicine.findById(id);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Medicine not found',
        });
      }
      if (!exists.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot adjust stock for deactivated medicine',
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Insufficient medicine stock available.',
      });
    }

    if (delta < 0) {
      const prevQty = updatedMedicine.quantity - delta; // delta is negative so this equals prevQty
      if (prevQty > updatedMedicine.reorderLevel && updatedMedicine.quantity <= updatedMedicine.reorderLevel) {
        notifyRoles(['pharmacist', 'admin'], {
          title: 'Low Stock Alert',
          message: `Medicine '${updatedMedicine.name}' is running low (${updatedMedicine.quantity} remaining, reorder level: ${updatedMedicine.reorderLevel}).`,
          type: 'pharmacy',
          priority: 'high',
          link: '/pharmacist/inventory',
          metadata: { medicineId: updatedMedicine._id },
          dedupeKey: `med-low-${updatedMedicine._id}-${updatedMedicine.quantity}`
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Stock for '${updatedMedicine.name}' updated by ${delta > 0 ? '+' : ''}${delta}. New total: ${updatedMedicine.quantity}`,
      data: updatedMedicine,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to adjust medicine stock',
      error: error.message,
    });
  }
};
