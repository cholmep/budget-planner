import { Request, Response } from 'express';
import Asset from '../models/Asset';
import { AuthRequest } from '../middleware/auth';

export const getAssets = async (req: AuthRequest, res: Response) => {
  try {
    const assets = await Asset.find({ userId: req.user._id });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assets' });
  }
};

export const getAsset = async (req: AuthRequest, res: Response) => {
  try {
    const asset = await Asset.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching asset' });
  }
};

export const createAsset = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, description, institution, accountNumber, amount } = req.body;

    const asset = new Asset({
      userId: req.user._id,
      name,
      type,
      description,
      institution,
      accountNumber,
      currentBalance: amount,
      balanceHistory: [{
        amount,
        date: new Date()
      }]
    });

    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Error creating asset' });
  }
};

export const updateAsset = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, description, institution, accountNumber } = req.body;
    
    const asset = await Asset.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    asset.name = name;
    asset.type = type;
    asset.description = description;
    asset.institution = institution;
    asset.accountNumber = accountNumber;

    await asset.save();
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Error updating asset' });
  }
};

export const deleteAsset = async (req: AuthRequest, res: Response) => {
  try {
    const asset = await Asset.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting asset' });
  }
};

export const addBalance = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, date } = req.body;
    
    const asset = await Asset.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    asset.balanceHistory.push({
      amount,
      date: new Date(date)
    });

    await asset.save();
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Error adding balance' });
  }
};

export const deleteBalance = async (req: AuthRequest, res: Response) => {
  try {
    const asset = await Asset.findOne({
      _id: req.params.assetId,
      userId: req.user._id
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const balanceIndex = asset.balanceHistory.findIndex(
      balance => balance._id?.toString() === req.params.balanceId
    );

    if (balanceIndex === -1) {
      return res.status(404).json({ message: 'Balance record not found' });
    }

    // Don't allow deleting the last balance record
    if (asset.balanceHistory.length === 1) {
      return res.status(400).json({ message: 'Cannot delete the last balance record' });
    }

    asset.balanceHistory.splice(balanceIndex, 1);
    await asset.save();
    
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting balance' });
  }
}; 