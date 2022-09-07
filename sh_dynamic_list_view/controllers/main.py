# -*- coding: utf-8 -*-
# Part of Softhealer Technologies.

from odoo.http import request
from odoo import http, fields, _
from odoo.addons.web.controllers.main import DataSet


class main(DataSet):
    
    def do_search_read(self, model, fields=False, offset=0, limit=False, domain=None
                       , sort=None):
        """ Performs a search() followed by a read() (if needed) using the
        provided search criteria

        :param str model: the name of the model to search on
        :param fields: a list of the fields to return in the result records
        :type fields: [str]
        :param int offset: from which index should the results start being returned
        :param int limit: the maximum number of records to return
        :param list domain: the search domain for the query
        :param list sort: sorting directives
        :returns: A structure (dict) with two keys: ids (all the ids matching
                  the (domain, context) pair) and records (paginated records
                  matching fields selection set)
        :rtype: list
        """
        Model = request.env[model]
        all_fields = request.env['sh.model.field'].sudo().search([('sh_attrs_model','=',model),('sh_invisible','=',False)])
        for field in all_fields:
            if field.sh_attrs_name not in fields:
                fields.append(field.sh_attrs_name)

        return Model.web_search_read(domain, fields, offset=offset, limit=limit, order=sort)
    