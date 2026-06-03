from workflow.services.version_label import bump_major_on_approve, bump_revision, display_version


def test_bump_revision_chain():
    assert bump_revision("0.1") == "0.2"
    assert bump_revision("0.9") == "0.9-0.1"
    assert bump_revision("0.9-0.1") == "0.9-0.2"
    assert bump_revision("0.9-0.9") == "0.9-0.9-0.1"
    assert bump_revision("3.0") == "3.1"


def test_bump_major_on_approve():
    assert bump_major_on_approve("0.2") == "1.0"
    assert bump_major_on_approve("0.9-0.9-0.3") == "1.0"
    assert bump_major_on_approve("3.2") == "4.0"


def test_display_version():
    assert display_version("0.9-0.1") == "V0.9-0.1"
