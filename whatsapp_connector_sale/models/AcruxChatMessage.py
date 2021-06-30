# -*- coding: utf-8 -*-
from odoo import models
from odoo import fields


class AcruxChatMessages(models.Model):
    _inherit = 'acrux.chat.message'

    ttype = fields.Selection(selection_add=[('sale_order', 'Order')])
    event = fields.Selection(selection_add=[('inv_sent', 'Invoice Sent'),
                                            ('order_sent', 'Order Sent')])

    def _get_user_id(self):
        user_id = super(AcruxChatMessages, self)._get_user_id()
        if not user_id and self.contact_id.res_partner_id.user_id.id:
            user_id = self.contact_id.res_partner_id.user_id.id
        return user_id
