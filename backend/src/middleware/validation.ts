import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const assetSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('savings', 'investment', 'property', 'other').required(),
  description: Joi.string().allow('').optional(),
  institution: Joi.string().allow('').optional(),
  accountNumber: Joi.string().allow('').optional(),
  amount: Joi.number().when('$isCreate', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.forbidden()
  })
});

const balanceSchema = Joi.object({
  amount: Joi.number().required(),
  date: Joi.date().required()
});

export const validateAsset = (isCreate = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = assetSchema.validate(req.body, {
      context: { isCreate }
    });
    
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    next();
  };
};

export const validateBalance = (req: Request, res: Response, next: NextFunction) => {
  const { error } = balanceSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  
  next();
}; 