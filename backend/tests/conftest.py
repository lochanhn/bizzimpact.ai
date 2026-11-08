import socket
import pytest
@pytest.fixture(autouse=True)
def no_network(monkeypatch):
 def forbidden(*args,**kwargs):raise AssertionError('External network access is forbidden in tests.')
 monkeypatch.setattr(socket,'getaddrinfo',forbidden)
 monkeypatch.setattr(socket,'create_connection',forbidden)
