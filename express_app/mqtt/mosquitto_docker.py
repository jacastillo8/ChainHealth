import os, yaml
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

class ComposeMqtt(object):
    
    def __init__(self, number_organizations, domain_name, net_names, 
                 swarm_length=1):
        if isinstance(net_names, str):
            net_names = tuple([net_names])
        if not isinstance(net_names, tuple):
            net_names = tuple(net_names)
        if not isinstance(swarm_length, tuple):
            swarm_length = tuple(swarm_length for i in range(number_organizations))
        self.path = path
        self.numOrgs = number_organizations
        self.domain = domain_name
        self.netNames = net_names
        self.swarm_length = swarm_length

    def create_env(self):
        with open('{}.env'.format(self.path), 'w+') as file:
            text = 'COMPOSE_PROJECT_NAME={}'.format(self.project_name)
            file.write(text)
            
    def create_compose_mqtt(self):
        doc = OrderedDict()
        doc['version'] = '2'
        doc['networks'] = OrderedDict()
        # Creating Multiple networks if wanted (bridge between BC and EMR)
        for net in self.netNames:
            doc['networks'][net] = None
        swarm = []
        for org in range(self.numOrgs):
            for instance in range(self.swarm_length[org]):
                port1 = str(7883 + 1000*len(swarm))
                port2 = str(7001 + 1000*len(swarm))
                mosquitto = OrderedDict()
                mosquitto['image'] = "eclipse-mosquitto"
                mosquitto['container_name'] = 'mosquitto{}.org{}.{}'.format(instance, 
                         org + 1, self.domain)
                mosquitto['volumes'] = ['./config:/mosquitto/config',
                                        './certs{}:/mosquitto/certs'.format(instance)]
                mosquitto['ports'] = ['{}:8883'.format(port1),
                                      '{}:9001'.format(port2)]
                mosquitto['networks'] = list(self.netNames)
                swarm.append(mosquitto)
        doc['services'] = OrderedDict((c['container_name'],c) for c in swarm)
        with open('{}docker-compose-mqtt.yaml'.format(self.path), 'w') as file:
            yaml.dump(doc, file, default_flow_style=False)
        
    def create_mqtt(self, project_name='net'):
        self.project_name = project_name
        print("[*] Files will be generated in '%s'" % self.path)
        print("[+] Generating compose for MQTT...", end='')
        self.create_compose_mqtt()
        print("DONE")
        print("[+] Generating environmental variable file...", end='')
        self.create_env()
        print("DONE\n")