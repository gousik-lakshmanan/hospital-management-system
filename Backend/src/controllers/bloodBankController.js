import mongoose from 'mongoose';
import BloodStock, { ALLOWED_BLOOD_GROUPS } from '../models/BloodStock.js';
import BloodDonor from '../models/BloodDonor.js';
import { notifyRoles } from '../services/notificationService.js';

// Helper to calculate status consistent with frontend design
export const calculateStockStatus = (units) => {
  if (units <= 0) return 'Out of Stock';
  if (units <= 2) return 'Emergency Alert';
  if (units <= 5) return 'Low Stock';
  return 'Normal';
};

// GET /api/blood-bank/stock - List inventory across all 8 blood groups
export const getBloodStock = async (req, res) => {
  try {
    const stockRecords = await BloodStock.find().sort({ bloodGroup: 1 });

    const formattedStock = stockRecords.map((item) => {
      const status = calculateStockStatus(item.units);
      return {
        _id: item._id,
        bloodGroup: item.bloodGroup,
        group: item.bloodGroup, // Frontend alias compatibility
        units: item.units,
        bags: item.units, // Frontend alias compatibility
        status,
        updatedAt: item.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedStock.length,
      data: formattedStock,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch blood stock inventory.',
      error: error.message,
    });
  }
};

// GET /api/blood-bank/stock/:bloodGroup - Get stock for specific blood group
export const getBloodStockByGroup = async (req, res) => {
  try {
    const { bloodGroup } = req.params;
    const cleanGroup = decodeURIComponent(bloodGroup).trim();

    if (!ALLOWED_BLOOD_GROUPS.includes(cleanGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group. Allowed groups: ${ALLOWED_BLOOD_GROUPS.join(', ')}`,
      });
    }

    const stock = await BloodStock.findOne({ bloodGroup: cleanGroup });
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Blood stock record for group ${cleanGroup} not found.`,
      });
    }

    const status = calculateStockStatus(stock.units);

    return res.status(200).json({
      success: true,
      data: {
        _id: stock._id,
        bloodGroup: stock.bloodGroup,
        group: stock.bloodGroup,
        units: stock.units,
        bags: stock.units,
        status,
        updatedAt: stock.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch blood stock for group.',
      error: error.message,
    });
  }
};

// PATCH /api/blood-bank/stock/:bloodGroup - Admin updates blood bag count
export const updateBloodStock = async (req, res) => {
  try {
    const { bloodGroup } = req.params;
    const cleanGroup = decodeURIComponent(bloodGroup).trim();

    if (!ALLOWED_BLOOD_GROUPS.includes(cleanGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group. Allowed groups: ${ALLOWED_BLOOD_GROUPS.join(', ')}`,
      });
    }

    const { units, bags, delta } = req.body;

    // Check if delta-based adjustment was provided
    if (delta !== undefined) {
      const parsedDelta = parseInt(delta, 10);
      if (isNaN(parsedDelta) || parsedDelta === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quantity.',
        });
      }

      if (parsedDelta < 0) {
        // Atomic decrement with condition units >= |delta|
        const updated = await BloodStock.findOneAndUpdate(
          {
            bloodGroup: cleanGroup,
            units: { $gte: Math.abs(parsedDelta) },
          },
          {
            $inc: { units: parsedDelta },
            $set: { updatedBy: req.user._id },
          },
          { new: true }
        );

        if (!updated) {
          return res.status(409).json({
            success: false,
            message: 'Insufficient blood stock.',
          });
        }

        const status = calculateStockStatus(updated.units);

        // Check if transition to critical shortage occurred
        const prevUnits = updated.units - parsedDelta; // parsedDelta is negative
        if (prevUnits > 2 && updated.units <= 2) {
          notifyRoles(['admin'], {
            title: 'Critical Blood Shortage',
            message: `Blood group ${cleanGroup} is at critical level (${updated.units} units remaining).`,
            type: 'blood_bank',
            priority: 'urgent',
            link: '/admin/blood-bank',
            metadata: { bloodGroup: cleanGroup, units: updated.units },
            dedupeKey: `blood-crit-${cleanGroup}-${updated.units}`
          });
        }

        return res.status(200).json({
          success: true,
          message: `Blood stock for ${cleanGroup} adjusted successfully.`,
          data: {
            _id: updated._id,
            bloodGroup: updated.bloodGroup,
            group: updated.bloodGroup,
            units: updated.units,
            bags: updated.units,
            status,
            updatedAt: updated.updatedAt,
          },
        });
      } else {
        // Atomic increment
        const updated = await BloodStock.findOneAndUpdate(
          { bloodGroup: cleanGroup },
          {
            $inc: { units: parsedDelta },
            $set: { updatedBy: req.user._id },
          },
          { new: true }
        );

        if (!updated) {
          return res.status(404).json({
            success: false,
            message: 'Blood stock not found.',
          });
        }

        const status = calculateStockStatus(updated.units);
        return res.status(200).json({
          success: true,
          message: `Blood stock for ${cleanGroup} increased successfully.`,
          data: {
            _id: updated._id,
            bloodGroup: updated.bloodGroup,
            group: updated.bloodGroup,
            units: updated.units,
            bags: updated.units,
            status,
            updatedAt: updated.updatedAt,
          },
        });
      }
    }

    // Absolute units count provided
    const targetUnits = units !== undefined ? units : bags;
    const parsedUnits = parseInt(targetUnits, 10);

    if (isNaN(parsedUnits) || parsedUnits < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity.',
      });
    }

    const updated = await BloodStock.findOneAndUpdate(
      { bloodGroup: cleanGroup },
      {
        $set: {
          units: parsedUnits,
          updatedBy: req.user._id,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Blood stock not found.',
      });
    }

    const status = calculateStockStatus(updated.units);
    return res.status(200).json({
      success: true,
      message: `Blood stock for ${cleanGroup} updated to ${updated.units} units.`,
      data: {
        _id: updated._id,
        bloodGroup: updated.bloodGroup,
        group: updated.bloodGroup,
        units: updated.units,
        bags: updated.units,
        status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update blood stock.',
      error: error.message,
    });
  }
};

// GET /api/blood-bank/donors - List registered donors (Admin, Doctor, Nurse, Receptionist)
export const getDonors = async (req, res) => {
  try {
    const { bloodGroup, search } = req.query;
    const filter = { isActive: true };

    if (bloodGroup && ALLOWED_BLOOD_GROUPS.includes(bloodGroup)) {
      filter.bloodGroup = bloodGroup;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const donors = await BloodDonor.find(filter).sort({ createdAt: -1 });

    const formattedDonors = donors.map((d, idx) => ({
      _id: d._id,
      id: `BD-${String(idx + 1).padStart(2, '0')}`,
      name: d.name,
      age: d.age,
      gender: d.gender,
      bloodGroup: d.bloodGroup,
      phone: d.phone,
      email: d.email || '',
      address: d.address || '',
      lastDonated: d.lastDonationDate
        ? new Date(d.lastDonationDate).toISOString().split('T')[0]
        : 'N/A',
      lastDonationDate: d.lastDonationDate,
      totalDonations: d.totalDonations,
      registeredByName: d.registeredByName,
      createdAt: d.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedDonors.length,
      data: formattedDonors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch blood donors list.',
      error: error.message,
    });
  }
};

// POST /api/blood-bank/donors - Register new blood donor (Admin only)
export const registerDonor = async (req, res) => {
  let session = null;
  let useTransaction = false;

  try {
    const { name, age, gender, bloodGroup, phone, email, address, lastDonationDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Donor name is required.',
      });
    }

    const parsedAge = parseInt(age, 10);
    if (!parsedAge || parsedAge < 18) {
      return res.status(400).json({
        success: false,
        message: 'Donor must be at least 18 years of age.',
      });
    }

    if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Valid gender (Male, Female, Other) is required.',
      });
    }

    const cleanBloodGroup = bloodGroup ? bloodGroup.trim() : '';
    if (!cleanBloodGroup || !ALLOWED_BLOOD_GROUPS.includes(cleanBloodGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group. Allowed groups: ${ALLOWED_BLOOD_GROUPS.join(', ')}`,
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Donor contact phone is required.',
      });
    }

    // Attempt MongoDB transaction
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch (txErr) {
      session = null;
      useTransaction = false;
    }

    const registeredByName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Administrator';

    const newDonor = new BloodDonor({
      name: name.trim(),
      age: parsedAge,
      gender,
      bloodGroup: cleanBloodGroup,
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : '',
      address: address ? address.trim() : '',
      lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : new Date(),
      totalDonations: 1,
      registeredBy: req.user._id,
      registeredByName,
      isActive: true,
    });

    if (useTransaction && session) {
      await newDonor.save({ session });
    } else {
      await newDonor.save();
    }

    // Increment stock for the donor's blood group by +1
    const stockUpdateQuery = { bloodGroup: cleanBloodGroup };
    const stockUpdateDoc = {
      $inc: { units: 1 },
      $set: { updatedBy: req.user._id },
    };
    const stockUpdateOptions = {
      new: true,
      upsert: true,
      ...(useTransaction && session ? { session } : {}),
    };

    const updatedStock = await BloodStock.findOneAndUpdate(
      stockUpdateQuery,
      stockUpdateDoc,
      stockUpdateOptions
    );

    if (useTransaction && session) {
      await session.commitTransaction();
    }

    const status = calculateStockStatus(updatedStock.units);

    return res.status(201).json({
      success: true,
      message: `Blood donor registered successfully and 1 blood bag added to ${cleanBloodGroup} inventory.`,
      data: {
        _id: newDonor._id,
        id: `BD-${newDonor._id.toString().slice(-4).toUpperCase()}`,
        name: newDonor.name,
        age: newDonor.age,
        gender: newDonor.gender,
        bloodGroup: newDonor.bloodGroup,
        phone: newDonor.phone,
        email: newDonor.email,
        lastDonated: newDonor.lastDonationDate
          ? new Date(newDonor.lastDonationDate).toISOString().split('T')[0]
          : 'Today',
        registeredByName: newDonor.registeredByName,
      },
      updatedStock: {
        _id: updatedStock._id,
        bloodGroup: updatedStock.bloodGroup,
        group: updatedStock.bloodGroup,
        units: updatedStock.units,
        bags: updatedStock.units,
        status,
        updatedAt: updatedStock.updatedAt,
      },
    });
  } catch (error) {
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // ignore
      }
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to register blood donor.',
      error: error.message,
    });
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (endErr) {
        // ignore
      }
    }
  }
};

// PATCH /api/blood-bank/donors/:id - Update donor details (Admin only)
export const updateDonor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, gender, bloodGroup, phone, email, address, lastDonationDate, totalDonations, isActive } = req.body;

    const donor = await BloodDonor.findById(id);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found.',
      });
    }

    if (name !== undefined) donor.name = name.trim();
    if (age !== undefined) donor.age = parseInt(age, 10);
    if (gender !== undefined && ['Male', 'Female', 'Other'].includes(gender)) donor.gender = gender;
    if (bloodGroup !== undefined && ALLOWED_BLOOD_GROUPS.includes(bloodGroup.trim())) donor.bloodGroup = bloodGroup.trim();
    if (phone !== undefined) donor.phone = phone.trim();
    if (email !== undefined) donor.email = email.trim().toLowerCase();
    if (address !== undefined) donor.address = address.trim();
    if (lastDonationDate !== undefined) donor.lastDonationDate = new Date(lastDonationDate);
    if (totalDonations !== undefined) donor.totalDonations = parseInt(totalDonations, 10);
    if (isActive !== undefined) donor.isActive = Boolean(isActive);

    await donor.save();

    return res.status(200).json({
      success: true,
      message: 'Donor updated successfully.',
      data: donor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update donor.',
      error: error.message,
    });
  }
};
