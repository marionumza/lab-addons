# Part of Softhealer Technologies.
{
    "name": "Dynamic List View",

    "author": "Softhealer Technologies",

    "website": "https://www.softhealer.com",

    "support": "support@softhealer.com",

    "version": "14.0",
    
    "license": "OPL-1",

    "category": "Extra Tools",

    "summary": "Dynamic List View, Dynamic Tree View, Dynamical Tree View, Custom List View, Custom Tree View,Dynamical List View, List View In Odoo, Tree View, Rename Field Tree View, Hide Fields List View,Change Sequence List View Odoo ",

    "description": """This module is useful to manage fields dynamically from the list view. You can hide/show fields, rename fields & change the sequence of the fields from the list view.""",

    "depends": ['base', 'web'],

    "data": [
        "security/base_security.xml",
        "security/ir.model.access.csv",
    ],
    'assets': {
        'web.assets_backend': [
            'sh_dynamic_list_view/static/src/js/list_controller.js',
            'sh_dynamic_list_view/static/src/scss/fields.scss',
        ],
        'web.assets_qweb': [
            'sh_dynamic_list_view/static/src/xml/listview.xml'
        ]
    },
    "images": ["static/description/background.png", ],
    "installable": True,
    "auto_install": False,
    "application": True,

    "price": "25",
    "currency": "EUR"
}
