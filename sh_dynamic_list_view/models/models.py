# Copyright (C) Softhealer Technologies.

from odoo import fields, models

class ShModelFields(models.Model):
    _name = 'sh.model.field'
    _description = "Model Field"

    sh_attrs_name = fields.Char('Field Name') 
    sh_attrs_label = fields.Char('Field Label') 
    sh_attrs_model = fields.Char('Model') 
    sh_invisible = fields.Boolean("Column Invisible")
    sh_sequence = fields.Integer("Sequence")

