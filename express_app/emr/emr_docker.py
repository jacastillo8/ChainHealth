import os, yaml, warnings
from yaml import CLoader as Loader
from collections import OrderedDict

path = os.getcwd()
path = path.replace('\\', '/') + '/'
    
# Setting-up YAML representers
class literal_str(str): pass
class folded_str(str): pass

def dict_representer(dumper, data):
    return dumper.represent_dict(data.items())

def dict_constructor(loader, node):
    return OrderedDict(loader.construct_pairs(node))

def literal_representer(dumper, data):
    return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')

def folded_representer(dumper, data):
    return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='>')

# Loader
_mapping_tag = yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG
Loader.add_constructor(_mapping_tag, dict_constructor)

# Dumper
yaml.add_representer(OrderedDict, dict_representer)
yaml.add_representer(type(None), 
                       lambda dumper, value: dumper.represent_scalar(u'tag:yaml.org,2002:null', ''))
yaml.add_representer(literal_str, literal_representer)
yaml.add_representer(folded_str, folded_representer)

class ComposeEMR(object):
    
    def __init__(self, number_emrs, domain_name, net_name):
        if not isinstance(number_emrs, int):
            raise Exception("Argument 'number_emrs' must be an integer")
        if isinstance(net_name, list) and len(net_name) > 1:
            raise Exception("Argument 'net_name' must be singular.")
        elif isinstance(net_name, list):
            net_name = net_name[0]
        self.path = path
        self.numEmrs = number_emrs
        self.domain = domain_name
        self.netName = net_name
        
    def create_env(self):
        with open('{}.env'.format(self.path), 'w+') as file:
            text = 'COMPOSE_PROJECT_NAME={}\n'.format(self.project_name)
            for e in range(self.numEmrs):
                text += 'SQL_PASSWORD{}={}\n'.format(e, self.passwords[e])
            file.write(text)
    
    def create_compose_emr(self):
        doc = OrderedDict()
        doc['version'] = '2'
        doc['volumes'] = OrderedDict()
        doc['networks'] = OrderedDict()
        doc['networks'][self.netName] = None
        emrs = []
        for e in range(self.numEmrs):
            port1 = str(7080 + 1000*e)
            port2 = str(7043 + 1000*e)
            # Creating necessary volumes
            doc['volumes']['openemr{}.{}'.format(e, self.domain)] = None
            doc['volumes']['openemr{}_db'.format(e)] = None
            doc['volumes']['openemr{}_assets'.format(e)] = None
            doc['volumes']['openemr{}_sites'.format(e)] = None
            doc['volumes']['openemr{}_modules'.format(e)] = None
            doc['volumes']['openemr{}_logs'.format(e)] = None
            doc['volumes']['openemr{}_vendor'.format(e)] = None
            doc['volumes']['openemr{}_ccda'.format(e)] = None
            # EMR instances
            emr = OrderedDict()
            emr['image'] = 'jacastillo8/openemr:latest'
            emr['container_name'] = 'openemr{}.{}'.format(e, self.domain)
            emr['ports'] = ['{}:80'.format(port1),
                            '{}:443'.format(port2)]
            emr['volumes'] = ['openemr{}.{}:/var/www/html/openemr'.format(e, self.domain),
                              'openemr{}_db:/var/lib/mysql'.format(e),
                              'openemr{}_assets:/var/www/html/openemr/public'.format(e),
                              'openemr{}_sites:/var/www/html/openemr/sites/default'.format(e),
                              'openemr{}_modules:/var/www/html/openemr/interface/modules/zend_modules/config'.format(e),
                              'openemr{}_logs:/var/log'.format(e),
                              'openemr{}_vendor:/var/www/html/openemr/vendor'.format(e),
                              'openemr{}_ccda:/var/www/html/openemr/ccdaservice'.format(e)]
            emr['environment'] = ['MYSQL_ROOT_PASSWORD=$SQL_PASSWORD{}'.format(e)]
            emr['networks'] = [self.netName]
            emrs.append(emr)
        # Generating DB Manager
        admin = OrderedDict()
        admin['image'] = 'phpmyadmin/phpmyadmin'
        admin['container_name'] = 'admin.{}'.format(self.domain)
        admin['ports'] = ['7040:80']
        hosts = ', '.join([h['container_name'] for h in emrs])
        admin['environment'] = ['PMA_HOSTS={}'.format(hosts)]
        admin['networks'] = [self.netName]
        # Updating doc file
        doc['services'] = OrderedDict((c['container_name'], c) for c in emrs + [admin])
        with open('{}docker-compose-emr.yaml'.format(self.path), 'w') as file:
            yaml.dump(doc, file, default_flow_style=False)

    # For multiple EMRs add passwords in list format    
    def create_emr(self, project_name='net', passwords=['root']):
        self.project_name = project_name
        if not isinstance(passwords, list):
            raise Exception("Argument 'passwords' must be a list")
        elif len(passwords) != self.numEmrs:
            warnings.warn("Mismatch length between instances and passwords. Defaulting passwords ['pass1', 'pass2',..., 'passN']")  
            self.passwords = ['root{}'.format(e) for e in range(self.numEmrs)]
        # Check if password is not the same for multiple instances
        elif len(set(passwords)) != len(passwords):
            raise Exception("Argument 'passwords' must have unique elements")
        else:
            self.passwords = passwords
        print("[*] Files will be generated in '%s'" % self.path)
        print("[+] Generating compose for EMRs...", end='')
        self.create_compose_emr()
        print("DONE")
        print("[+] Generating environmental variable file...", end='')
        self.create_env()
        print("DONE\n")